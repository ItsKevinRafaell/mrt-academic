package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"mrt-backend/internal/domain"
)

type mockAuthService struct {
	validateFunc func(token string) (*domain.User, error)
}

func (m *mockAuthService) ValidateToken(token string) (*domain.User, error) {
	return m.validateFunc(token)
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	mockUser := &domain.User{
		ID:    "user123",
		Email: "test@example.com",
		Role:  domain.RoleStudent,
	}

	mockAuth := &mockAuthService{
		validateFunc: func(token string) (*domain.User, error) {
			return mockUser, nil
		},
	}

	middleware := NewAuthMiddleware(mockAuth)

	handler := middleware.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(UserIDKey).(string)
		if userID != "user123" {
			t.Errorf("expected userID user123, got %s", userID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
	mockAuth := &mockAuthService{}
	middleware := NewAuthMiddleware(mockAuth)

	handler := middleware.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", rr.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	mockAuth := &mockAuthService{
		validateFunc: func(token string) (*domain.User, error) {
			return nil, domain.ErrInvalidToken
		},
	}

	middleware := NewAuthMiddleware(mockAuth)

	handler := middleware.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", rr.Code)
	}
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	mockAuth := &mockAuthService{
		validateFunc: func(token string) (*domain.User, error) {
			return nil, domain.ErrTokenExpired
		},
	}

	middleware := NewAuthMiddleware(mockAuth)

	handler := middleware.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer expired-token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", rr.Code)
	}
}

func TestRequireRole_AllowedRole(t *testing.T) {
	mockUser := &domain.User{
		ID:    "user123",
		Email: "admin@example.com",
		Role:  domain.RoleAdmin,
	}

	mockAuth := &mockAuthService{
		validateFunc: func(token string) (*domain.User, error) {
			return mockUser, nil
		},
	}

	authMiddleware := NewAuthMiddleware(mockAuth)
	roleMiddleware := NewRoleMiddleware()

	handler := authMiddleware.Authenticate(
		roleMiddleware.RequireRole(domain.RoleAdmin)(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}),
		),
	)

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer admin-token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}

func TestRequireRole_ForbiddenRole(t *testing.T) {
	mockUser := &domain.User{
		ID:    "user123",
		Email: "student@example.com",
		Role:  domain.RoleStudent,
	}

	mockAuth := &mockAuthService{
		validateFunc: func(token string) (*domain.User, error) {
			return mockUser, nil
		},
	}

	authMiddleware := NewAuthMiddleware(mockAuth)
	roleMiddleware := NewRoleMiddleware()

	handler := authMiddleware.Authenticate(
		roleMiddleware.RequireRole(domain.RoleAdmin)(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}),
		),
	)

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer student-token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", rr.Code)
	}
}

func TestCORS(t *testing.T) {
	middleware := NewCORSMiddleware()

	handler := middleware.Handle(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("OPTIONS", "/", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	if rr.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("expected Access-Control-Allow-Origin header")
	}
}
