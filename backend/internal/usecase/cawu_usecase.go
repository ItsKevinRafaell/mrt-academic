package usecase

import (
	"fmt"
	"mrt-backend/internal/domain"
	"strconv"
)

type CawuUsecase struct {
	cawuRepo     domain.CawuRepository
	settingsRepo domain.SystemSettingsRepository
}

func NewCawuUsecase(cawuRepo domain.CawuRepository, settingsRepo domain.SystemSettingsRepository) *CawuUsecase {
	return &CawuUsecase{
		cawuRepo:     cawuRepo,
		settingsRepo: settingsRepo,
	}
}

func (uc *CawuUsecase) CreateCawu(cawu *domain.Cawu) error {
	if cawu.Name == "" {
		return fmt.Errorf("cawu name is required")
	}
	if cawu.Year < 2020 {
		return fmt.Errorf("invalid year")
	}
	if cawu.Semester < 1 || cawu.Semester > 2 {
		return fmt.Errorf("semester must be 1 or 2")
	}
	return uc.cawuRepo.Create(cawu)
}

func (uc *CawuUsecase) GetAllCawus() ([]domain.Cawu, error) {
	return uc.cawuRepo.GetAll()
}

func (uc *CawuUsecase) GetCawuByID(id int) (*domain.Cawu, error) {
	return uc.cawuRepo.GetByID(id)
}

func (uc *CawuUsecase) GetActiveCawu() (*domain.Cawu, error) {
	return uc.cawuRepo.GetActive()
}

func (uc *CawuUsecase) SetActiveCawu(id int) error {
	// Verify cawu exists
	_, err := uc.cawuRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("cawu not found")
	}

	// Set as active
	if err := uc.cawuRepo.SetActive(id); err != nil {
		return err
	}

	// Also store in system_settings for quick access
	idStr := strconv.Itoa(id)
	return uc.settingsRepo.Set("active_cawu_id", idStr)
}

func (uc *CawuUsecase) GetActiveCawuID() (int, error) {
	idStr, err := uc.settingsRepo.Get("active_cawu_id")
	if err != nil {
		return 0, err
	}
	if idStr == "" {
		return 0, nil
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (uc *CawuUsecase) UpdateCawu(cawu *domain.Cawu) error {
	if cawu.ID == 0 {
		return fmt.Errorf("cawu ID is required")
	}
	return uc.cawuRepo.Update(cawu)
}

func (uc *CawuUsecase) DeleteCawu(id int) error {
	return uc.cawuRepo.Delete(id)
}
