package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port              string
	DatabaseURL       string
	JWTSecret         string
	AllowedOrigins    string
	RateLimitRPM      int
	SearchCacheTTL    time.Duration
	DashboardCacheTTL time.Duration
	GoogleCalJSONKey  string
	GoogleCalID       string
	TrustedProxyIPs   []string
	UploadDir         string
}

func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	databaseURL := getEnv("DATABASE_URL", "postgres://mrt:secret@localhost:5432/mrt_db?sslmode=disable")
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}
	allowedOrigins := getEnv("ALLOWED_ORIGINS", "http://localhost:3000")
	rateLimitRPM, err := parseInt(getEnv("RATE_LIMIT_RPM", "100"))
	if err != nil {
		return nil, fmt.Errorf("invalid RATE_LIMIT_RPM: %v", err)
	}
	searchCacheTTL := parseDuration(getEnv("SEARCH_CACHE_TTL", "5m"))
	dashboardCacheTTL := parseDuration(getEnv("DASHBOARD_CACHE_TTL", "1m"))
	googleCalJSONKey := loadGoogleCalJSONKey()
	googleCalID := getEnv("GOOGLE_CAL_ID", "")
	trustedProxyIPs := parseProxyIPs(getEnv("TRUSTED_PROXY_IPS", ""))

	return &Config{
		Port:              port,
		DatabaseURL:       databaseURL,
		JWTSecret:         jwtSecret,
		AllowedOrigins:    allowedOrigins,
		RateLimitRPM:      rateLimitRPM,
		SearchCacheTTL:    searchCacheTTL,
		DashboardCacheTTL: dashboardCacheTTL,
		GoogleCalJSONKey:  googleCalJSONKey,
		GoogleCalID:       googleCalID,
		TrustedProxyIPs:   trustedProxyIPs,
		UploadDir:         getEnv("UPLOAD_DIR", "./uploads"),
	}, nil
}

func parseProxyIPs(ips string) []string {
	if ips == "" {
		return nil
	}
	result := []string{}
	for _, ip := range strings.Split(ips, ",") {
		trimmed := strings.TrimSpace(ip)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// loadGoogleCalJSONKey tries path first, then falls back to inline JSON
func loadGoogleCalJSONKey() string {
	// Try file path first (safer)
	path := getEnv("GOOGLE_CAL_JSON_KEY_PATH", "")
	if path != "" {
		data, err := os.ReadFile(path)
		if err == nil {
			return string(data)
		}
	}
	// Fallback to inline JSON
	return getEnv("GOOGLE_CAL_JSON_KEY", "")
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func parseInt(val string) (int, error) {
	var result int
	n, err := fmt.Sscanf(val, "%d", &result)
	if err != nil || n != 1 {
		return 0, fmt.Errorf("cannot parse '%s' as integer", val)
	}
	return result, nil
}

func parseDuration(val string) time.Duration {
	d, err := time.ParseDuration(val)
	if err != nil {
		return 5 * time.Minute
	}
	return d
}

func (c *Config) ServerAddr() string {
	return fmt.Sprintf(":%s", c.Port)
}

func (c *Config) HasGoogleCalendar() bool {
	return c.GoogleCalJSONKey != "" && c.GoogleCalID != ""
}
