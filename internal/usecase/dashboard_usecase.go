package usecase

import (
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
)

type DashboardUsecase struct {
	dashboardRepo *postgres.DashboardRepo
}

func NewDashboardUsecase(dashboardRepo *postgres.DashboardRepo) *DashboardUsecase {
	return &DashboardUsecase{dashboardRepo: dashboardRepo}
}

func (u *DashboardUsecase) GetSummary(userID string) (*domain.DashboardSummary, error) {
	return u.dashboardRepo.GetSummary(userID)
}
