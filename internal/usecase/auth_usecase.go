package usecase

import (
	"context"
	"errors"
	"mrt-backend/internal/domain"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthUsecase struct {
	userRepo     domain.UserRepository
	userRoleRepo domain.UserRoleRepository
	jwtSecret    string
}

func NewAuthUsecase(
	userRepo domain.UserRepository,
	userRoleRepo domain.UserRoleRepository,
	jwtSecret string,
) *AuthUsecase {
	return &AuthUsecase{
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
		jwtSecret:    jwtSecret,
	}
}

type RegisterRequest struct {
	NIM      string
	FullName string
	Email    string
	Password string
}

type LoginRequest struct {
	Email    string
	Password string
}

type LoginResponse struct {
	Token string
	User  *domain.User
	Role  string
}

func (uc *AuthUsecase) Register(ctx context.Context, req RegisterRequest) (*domain.User, error) {
	if req.NIM == "" || req.FullName == "" || req.Email == "" || req.Password == "" {
		return nil, domain.ErrValidation
	}

	if len(req.Password) < 6 {
		return nil, errors.New("password must be at least 6 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, domain.ErrInternal
	}

	user := &domain.User{
		NIM:          req.NIM,
		FullName:     req.FullName,
		Email:        req.Email,
		PasswordHash: string(hash),
	}

	if err := uc.userRepo.Create(user); err != nil {
		return nil, err
	}

	userRole := &domain.UserRole{
		UserID: user.ID,
		Role:   domain.RoleMahasiswa,
	}
	if err := uc.userRoleRepo.Assign(userRole); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *AuthUsecase) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, domain.ErrValidation
	}

	user, err := uc.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, domain.ErrUnauthorized
	}

	role, err := uc.userRoleRepo.GetPrimaryRole(user.ID)
	if err != nil {
		return nil, domain.ErrInternal
	}

	token, err := uc.generateToken(user.ID, user.Email, role)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return &LoginResponse{
		Token: token,
		User:  user,
		Role:  role,
	}, nil
}

func (uc *AuthUsecase) GetCurrentUser(ctx context.Context, userID string) (*domain.User, string, error) {
	user, err := uc.userRepo.GetByID(userID)
	if err != nil {
		return nil, "", err
	}

	role, err := uc.userRoleRepo.GetPrimaryRole(userID)
	if err != nil {
		return nil, "", err
	}

	return user, role, nil
}

func (uc *AuthUsecase) ValidateToken(tokenString string) (string, string, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, domain.ErrInvalidToken
		}
		return []byte(uc.jwtSecret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return "", "", "", domain.ErrTokenExpired
		}
		return "", "", "", domain.ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", "", "", domain.ErrInvalidToken
	}

	userID, _ := claims["user_id"].(string)
	email, _ := claims["email"].(string)
	role, _ := claims["role"].(string)

	return userID, email, role, nil
}

func (uc *AuthUsecase) generateToken(userID, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(uc.jwtSecret))
}
