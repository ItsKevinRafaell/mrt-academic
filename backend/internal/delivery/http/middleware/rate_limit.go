package middleware

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	requestsPerMinute int
	bucketSize        int
	clients           map[string]*clientBucket
	mu                sync.RWMutex
}

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
	mu         sync.Mutex
}

func NewRateLimiter() *RateLimiter {
	rateLimitEnv := os.Getenv("RATE_LIMIT_RPM")
	requestsPerMinute := 100

	if rateLimitEnv != "" {
		if parsed, err := strconv.Atoi(rateLimitEnv); err == nil && parsed > 0 {
			requestsPerMinute = parsed
		}
	}

	rl := &RateLimiter{
		requestsPerMinute: requestsPerMinute,
		bucketSize:        requestsPerMinute,
		clients:           make(map[string]*clientBucket),
	}

	go rl.cleanupExpiredClients()

	return rl
}

func (rl *RateLimiter) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := getClientIP(r)

		if !rl.allow(clientIP) {
			http.Error(w, `{"success":false,"message":"Too many requests","error_code":"ERR_RATE_LIMITED"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) allow(clientIP string) bool {
	rl.mu.Lock()
	bucket, exists := rl.clients[clientIP]
	if !exists {
		bucket = &clientBucket{
			tokens:     float64(rl.bucketSize) - 1,
			lastRefill: time.Now(),
		}
		rl.clients[clientIP] = bucket
		rl.mu.Unlock()
		return true
	}
	rl.mu.Unlock()

	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(bucket.lastRefill).Seconds()
	refillRate := float64(rl.requestsPerMinute) / 60.0

	bucket.tokens += elapsed * refillRate
	if bucket.tokens > float64(rl.bucketSize) {
		bucket.tokens = float64(rl.bucketSize)
	}
	bucket.lastRefill = now

	if bucket.tokens < 1 {
		return false
	}

	bucket.tokens--
	return true
}

func (rl *RateLimiter) cleanupExpiredClients() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		for ip, bucket := range rl.clients {
			bucket.mu.Lock()
			if time.Since(bucket.lastRefill) > 10*time.Minute {
				delete(rl.clients, ip)
			}
			bucket.mu.Unlock()
		}
		rl.mu.Unlock()
	}
}

func getClientIP(r *http.Request) string {
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	return r.RemoteAddr
}