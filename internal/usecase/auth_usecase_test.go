package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"mrt-backend/internal/domain"
)

type mockUserRepo struct {
	users map[string]*domain.User
}

func (m *mockUserRepo) Create(ctx context.Context, u *domain.User) error {
	m.users[u.Email] = u
	return nil
}

func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	u, ok := m.users[email]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return u, nil
}

func (m *mockUserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}

type mockUserRoleRepo struct {
	roles map[string]string
}

func (m *mockUserRoleRepo) GetByUserID(ctx context.Context, userID string) ([]domain.UserRole, error) {
	role, ok := m.roles[userID]
	if !ok {
		return []domain.UserRole{{Role: "mahasiswa"}}, nil
	}
	return []domain.UserRole{{Role: role}}, nil
}

func TestAuthUsecase_Register_Success(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	req := RegisterRequest{
		NIM:      "12345678",
		FullName: "John Doe",
		Email:    "john@test.com",
		Password: "password123",
	}

	user, err := uc.Register(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if user.Email != "john@test.com" {
		t.Errorf("expected email john@test.com, got %s", user.Email)
	}
	if user.PasswordHash == "password123" {
		t.Error("password should be hashed")
	}
}

func TestAuthUsecase_Register_ValidationError(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	tests := []struct {
		name string
		req  RegisterRequest
	}{
		{"empty email", RegisterRequest{NIM: "123", FullName: "Test", Password: "pass123"}},
		{"empty password", RegisterRequest{NIM: "123", FullName: "Test", Email: "test@test.com"}},
		{"short password", RegisterRequest{NIM: "123", FullName: "Test", Email: "test@test.com", Password: "123"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := uc.Register(context.Background(), tt.req)
			if !errors.Is(err, domain.ErrValidation) {
				t.Errorf("expected ErrValidation, got %v", err)
			}
		})
	}
}

func TestAuthUsecase_Login_Success(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	registerReq := RegisterRequest{
		NIM:      "12345678",
		FullName: "John Doe",
		Email:    "john@test.com",
		Password: "password123",
	}
	uc.Register(context.Background(), registerReq)

	loginReq := LoginRequest{
		Email:    "john@test.com",
		Password: "password123",
	}

	resp, err := uc.Login(context.Background(), loginReq)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Token == "" {
		t.Error("expected token to be generated")
	}
	if resp.User.Email != "john@test.com" {
		t.Errorf("expected email john@test.com, got %s", resp.User.Email)
	}
}

func TestAuthUsecase_Login_WrongPassword(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	registerReq := RegisterRequest{
		NIM:      "12345678",
		FullName: "John Doe",
		Email:    "john@test.com",
		Password: "password123",
	}
	uc.Register(context.Background(), registerReq)

	loginReq := LoginRequest{
		Email:    "john@test.com",
		Password: "wrongpassword",
	}

	_, err := uc.Login(context.Background(), loginReq)

	if !errors.Is(err, domain.ErrUnauthorized) {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestAuthUsecase_Login_UserNotFound(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	loginReq := LoginRequest{
		Email:    "notfound@test.com",
		Password: "password123",
	}

	_, err := uc.Login(context.Background(), loginReq)

	if !errors.Is(err, domain.ErrUnauthorized) {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestAuthUsecase_ValidateToken_Success(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	registerReq := RegisterRequest{
		NIM:      "12345678",
		FullName: "John Doe",
		Email:    "john@test.com",
		Password: "password123",
	}
	uc.Register(context.Background(), registerReq)

	loginReq := LoginRequest{
		Email:    "john@test.com",
		Password: "password123",
	}
	resp, _ := uc.Login(context.Background(), loginReq)

	userID, email, role, err := uc.ValidateToken(resp.Token)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if email != "john@test.com" {
		t.Errorf("expected email john@test.com, got %s", email)
	}
	if userID == "" {
		t.Error("expected userID to be returned")
	}
	if role == "" {
		t.Error("expected role to be returned")
	}
}

func TestAuthUsecase_ValidateToken_InvalidToken(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	_, _, _, err := uc.ValidateToken("invalid-token")

	if !errors.Is(err, domain.ErrInvalidToken) {
		t.Errorf("expected ErrInvalidToken, got %v", err)
	}
}

func TestAuthUsecase_GetCurrentUser_Success(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	registerReq := RegisterRequest{
		NIM:      "12345678",
		FullName: "John Doe",
		Email:    "john@test.com",
		Password: "password123",
	}
	user, _ := uc.Register(context.Background(), registerReq)

	currentUser, role, err := uc.GetCurrentUser(context.Background(), user.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if currentUser.Email != "john@test.com" {
		t.Errorf("expected email john@test.com, got %s", currentUser.Email)
	}
	if role != "mahasiswa" {
		t.Errorf("expected role mahasiswa, got %s", role)
	}
}

func TestAuthUsecase_GetCurrentUser_NotFound(t *testing.T) {
	mockRepo := &mockUserRepo{users: make(map[string]*domain.User)}
	mockRoleRepo := &mockUserRoleRepo{roles: make(map[string]string)}
	uc := NewAuthUsecase(mockRepo, mockRoleRepo, "test-secret")

	_, _, err := uc.GetCurrentUser(context.Background(), "nonexistent-id")

	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
