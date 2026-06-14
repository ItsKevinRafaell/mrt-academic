package usecase

import (
	"context"
	"testing"
	"time"

	"mrt-backend/internal/domain"
)

type mockDashboardRepo struct {
	summary *domain.DashboardSummary
}

func (m *mockDashboardRepo) GetSummary(ctx context.Context, userID string) (*domain.DashboardSummary, error) {
	return m.summary, nil
}

func TestDashboardUsecase_GetSummary_Success(t *testing.T) {
	mockSummary := &domain.DashboardSummary{
		TotalCourses:     5,
		PendingTasks:     3,
		CompletedTasks:   10,
		UpcomingEvents:   []domain.Event{},
		RecentActivities: []domain.Activity{},
	}

	mockRepo := &mockDashboardRepo{summary: mockSummary}
	uc := NewDashboardUsecase(mockRepo)

	summary, err := uc.GetSummary(context.Background(), "user123")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if summary.TotalCourses != 5 {
		t.Errorf("expected TotalCourses 5, got %d", summary.TotalCourses)
	}
	if summary.PendingTasks != 3 {
		t.Errorf("expected PendingTasks 3, got %d", summary.PendingTasks)
	}
	if summary.CompletedTasks != 10 {
		t.Errorf("expected CompletedTasks 10, got %d", summary.CompletedTasks)
	}
}
