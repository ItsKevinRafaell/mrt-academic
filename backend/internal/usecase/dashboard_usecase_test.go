package usecase

import (
	"mrt-backend/internal/domain"
	"testing"
)

type mockDashboardRepo struct {
	summary *domain.DashboardSummary
}

func (m *mockDashboardRepo) GetSummary(userID string) (*domain.DashboardSummary, error) {
	return m.summary, nil
}

func TestDashboardUsecase_GetSummary(t *testing.T) {
	expected := &domain.DashboardSummary{
		TotalCourses:   5,
		PendingTasks:   3,
		CompletedTasks: 10,
	}
	mock := &mockDashboardRepo{summary: expected}
	uc := NewDashboardUsecase(mock)

	summary, err := uc.GetSummary("user123")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if summary.TotalCourses != 5 {
		t.Errorf("expected 5 courses, got %d", summary.TotalCourses)
	}
	if summary.PendingTasks != 3 {
		t.Errorf("expected 3 pending tasks, got %d", summary.PendingTasks)
	}
}
