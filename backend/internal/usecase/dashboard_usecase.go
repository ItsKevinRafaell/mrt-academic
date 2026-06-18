package usecase

import (
	"mrt-backend/internal/domain"
)

type DashboardUsecase struct {
	dashboardRepo domain.DashboardRepository
}

func NewDashboardUsecase(dashboardRepo domain.DashboardRepository) *DashboardUsecase {
	return &DashboardUsecase{dashboardRepo: dashboardRepo}
}

func (u *DashboardUsecase) GetSummary(userID string) (*domain.DashboardSummary, error) {
	return u.dashboardRepo.GetSummary(userID)
}
