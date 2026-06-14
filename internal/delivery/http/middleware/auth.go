package middleware

import (
	"context"
	"mrt-backend/internal/domain"
	"net/http"
	"strings"

	"mrt-backend/internal/usecase"
)

type contextKey string

const (
	ContextKeyUserID contextKey = "user_id"
	ContextKeyEmail  contextKey = "email"
	ContextKeyRole   contextKey = "role"
)

type AuthMiddleware struct {
	authUsecase *usecase.AuthUsecase
}

func NewAuthMiddleware(authUsecase *usecase.AuthUsecase) *AuthMiddleware {
	return &AuthMiddleware{authUsecase: authUsecase}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeAuthError(w, http.StatusUnauthorized, "Authorization header required", "ERR_UNAUTHORIZED")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeAuthError(w, http.StatusUnauthorized, "Invalid authorization header format", "ERR_UNAUTHORIZED")
			return
		}

		userID, email, role, err := m.authUsecase.ValidateToken(parts[1])
		if err != nil {
			code := "ERR_UNAUTHORIZED"
			if err == domain.ErrTokenExpired {
				code = "ERR_TOKEN_EXPIRED"
			} else if err == domain.ErrInvalidToken {
				code = "ERR_INVALID_TOKEN"
			}
			writeAuthError(w, http.StatusUnauthorized, err.Error(), code)
			return
		}

		ctx := context.WithValue(r.Context(), ContextKeyUserID, userID)
		ctx = context.WithValue(ctx, ContextKeyEmail, email)
		ctx = context.WithValue(ctx, ContextKeyRole, role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *AuthMiddleware) RequireAdmin() func(http.Handler) http.Handler {
	roleMap := make(map[string]bool)
	for _, role := range domain.AdminRoles {
		roleMap[role] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(ContextKeyRole).(string)
			if !ok || !roleMap[role] {
				writeAuthError(w, http.StatusForbidden, "Insufficient permissions", "ERR_FORBIDDEN")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func GetUserID(ctx context.Context) string {
	if val, ok := ctx.Value(ContextKeyUserID).(string); ok {
		return val
	}
	return ""
}

func GetRole(ctx context.Context) string {
	if val, ok := ctx.Value(ContextKeyRole).(string); ok {
		return val
	}
	return ""
}

func writeAuthError(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write([]byte(`{"success":false,"message":"` + message + `","error_code":"` + code + `","data":null}`))
}
