package config

import (
	"fmt"
	"os"
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
}

func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://mrt:secret@localhost:5432/mrt_db?sslmode=disable"),
		JWTSecret:         getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		AllowedOrigins:    getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		RateLimitRPM:      parseInt(getEnv("RATE_LIMIT_RPM", "100")),
		SearchCacheTTL:    parseDuration(getEnv("SEARCH_CACHE_TTL", "5m")),
		DashboardCacheTTL: parseDuration(getEnv("DASHBOARD_CACHE_TTL", "1m")),
		GoogleCalJSONKey:  loadGoogleCalJSONKey(),
		GoogleCalID:       getEnv("GOOGLE_CAL_ID", ""),
	}
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

func parseInt(val string) int {
	var result int
	fmt.Sscanf(val, "%d", &result)
	return result
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
