package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type stubAuthRepo struct {
	users map[string]*domain.User
}

func (s *stubAuthRepo) Create(user *domain.User) error {
	user.ID = "user-1"
	s.users[user.Email] = user
	return nil
}
func (s *stubAuthRepo) GetByEmail(email string) (*domain.User, error) {
	u, ok := s.users[email]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return u, nil
}
func (s *stubAuthRepo) GetByID(id string) (*domain.User, error) {
	for _, u := range s.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (s *stubAuthRepo) GetAll() ([]domain.User, error) { return nil, nil }

type stubAuthRoleRepo struct {
	roles map[string]string
}

func (s *stubAuthRoleRepo) Assign(ur *domain.UserRole) error {
	s.roles[ur.UserID] = ur.Role
	return nil
}
func (s *stubAuthRoleRepo) GetByUserID(userID string) ([]domain.UserRole, error) {
	return []domain.UserRole{{Role: s.roles[userID]}}, nil
}
func (s *stubAuthRoleRepo) GetPrimaryRole(userID string) (string, error) {
	return s.roles[userID], nil
}
func (s *stubAuthRoleRepo) UpdateUserRole(ur *domain.UserRole) error {
	s.roles[ur.UserID] = ur.Role
	return nil
}

func TestAuthHandler_Register_Success(t *testing.T) {
	userRepo := &stubAuthRepo{users: make(map[string]*domain.User)}
	roleRepo := &stubAuthRoleRepo{roles: make(map[string]string)}
	uc := usecase.NewAuthUsecase(userRepo, roleRepo, "test-secret")
	h := NewAuthHandler(uc)

	body := `{"nim":"12345","full_name":"John Doe","email":"john@test.com","password":"password123"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.Register(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rr.Code)
	}

	resp := parseResponse(t, rr)
	if !resp.Success {
		t.Error("expected success true")
	}
}

func TestAuthHandler_Register_InvalidBody(t *testing.T) {
	userRepo := &stubAuthRepo{users: make(map[string]*domain.User)}
	roleRepo := &stubAuthRoleRepo{roles: make(map[string]string)}
	uc := usecase.NewAuthUsecase(userRepo, roleRepo, "test-secret")
	h := NewAuthHandler(uc)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", strings.NewReader("not-json"))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}
}

func TestAuthHandler_Login_Success(t *testing.T) {
	userRepo := &stubAuthRepo{users: make(map[string]*domain.User)}
	roleRepo := &stubAuthRoleRepo{roles: make(map[string]string)}
	uc := usecase.NewAuthUsecase(userRepo, roleRepo, "test-secret")
	h := NewAuthHandler(uc)

	regBody := `{"nim":"12345","full_name":"John","email":"john@test.com","password":"password123"}`
	regReq := httptest.NewRequest("POST", "/api/v1/auth/register", strings.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regRR := httptest.NewRecorder()
	h.Register(regRR, regReq)

	loginBody := `{"email":"john@test.com","password":"password123"}`
	loginReq := httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRR := httptest.NewRecorder()

	h.Login(loginRR, loginReq)

	if loginRR.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", loginRR.Code)
	}

	resp := parseResponse(t, loginRR)
	if !resp.Success {
		t.Error("expected success true")
	}
}

func TestAuthHandler_GetCurrentUser(t *testing.T) {
	userRepo := &stubAuthRepo{users: map[string]*domain.User{
		"john@test.com": {ID: "user-1", Email: "john@test.com", FullName: "John"},
	}}
	roleRepo := &stubAuthRoleRepo{roles: map[string]string{
		"user-1": domain.RoleMahasiswa,
	}}
	uc := usecase.NewAuthUsecase(userRepo, roleRepo, "test-secret")
	h := NewAuthHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/users/me", nil)
	req = withAuthContext(req, "user-1", "john@test.com", domain.RoleMahasiswa)
	rr := httptest.NewRecorder()

	h.GetCurrentUser(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}
