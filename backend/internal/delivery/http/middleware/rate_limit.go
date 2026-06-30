package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	requestsPerMinute int
	bucketSize       int
	clients          map[string]*clientBucket
	mu               sync.RWMutex
	trustedProxies   map[string]bool
}

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
	mu         sync.Mutex
}

func NewRateLimiter(trustedProxies []string) *RateLimiter {
	requestsPerMinute := 100
	proxyMap := make(map[string]bool)

	for _, ip := range trustedProxies {
		proxyMap[ip] = true
	}

	rl := &RateLimiter{
		requestsPerMinute: requestsPerMinute,
		bucketSize:        requestsPerMinute,
		clients:           make(map[string]*clientBucket),
		trustedProxies:    proxyMap,
	}

	go rl.cleanupExpiredClients()

	return rl
}

func (rl *RateLimiter) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := rl.getClientIP(r)

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

func (rl *RateLimiter) getClientIP(r *http.Request) string {
	clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		clientIP = r.RemoteAddr
	}

	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" && len(rl.trustedProxies) > 0 {
		ips := strings.Split(xff, ",")
		for _, ip := range ips {
			trimmed := strings.TrimSpace(ip)
			if rl.trustedProxies[trimmed] {
				continue
			}
			return trimmed
		}
	}

	xri := r.Header.Get("X-Real-IP")
	if xri != "" && len(rl.trustedProxies) > 0 {
		if !rl.trustedProxies[xri] {
			return xri
		}
	}

	return clientIP
}