package usecase

import (
	"errors"
	"mrt-backend/internal/domain"
)

type UserUseCase struct {
	userRepo     domain.UserRepository
	userRoleRepo domain.UserRoleRepository
}

func NewUserUseCase(userRepo domain.UserRepository, userRoleRepo domain.UserRoleRepository) *UserUseCase {
	return &UserUseCase{
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
	}
}

func (uc *UserUseCase) GetAllUsers() ([]domain.User, error) {
	return uc.userRepo.GetAll()
}

func (uc *UserUseCase) GetUserByID(id string) (*domain.User, error) {
	return uc.userRepo.GetByID(id)
}

func (uc *UserUseCase) UpdateUserRole(userID string, role string) error {
	if userID == "" {
		return errors.New("user ID is required")
	}
	if role == "" {
		return errors.New("role is required")
	}

	validRoles := map[string]bool{
		"MAHASISWA":    true,
		"DOSEN":        true,
		"SUPER_ADMIN":  true,
		"KURIKULUM":    true,
		"SEKRETARIS":   true,
		"KOMTI":        true,
		"WAKOMTI":      true,
	}

	if !validRoles[role] {
		return errors.New("invalid role")
	}

	userRole := &domain.UserRole{
		UserID: userID,
		Role:   role,
	}

	return uc.userRoleRepo.UpdateUserRole(userRole)
}

func (uc *UserUseCase) GetAvailableRoles() ([]string, error) {
	return []string{"MAHASISWA", "DOSEN", "SUPER_ADMIN", "KURIKULUM", "SEKRETARIS", "KOMTI", "WAKOMTI"}, nil
}
