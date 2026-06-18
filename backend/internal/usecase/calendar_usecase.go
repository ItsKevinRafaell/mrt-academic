package usecase

import (
	"context"
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type CalendarUsecase struct {
	calendarRepo domain.CalendarEventRepository
}

func NewCalendarUsecase(calendarRepo domain.CalendarEventRepository) *CalendarUsecase {
	return &CalendarUsecase{calendarRepo: calendarRepo}
}

func (u *CalendarUsecase) CreateEvent(ctx context.Context, event *domain.CalendarEvent) error {
	// Validate required fields
	if event.Title == "" {
		return domain.ErrValidation
	}
	if event.StartTime.IsZero() || event.EndTime.IsZero() {
		return domain.ErrValidation
	}
	if event.EndTime.Before(event.StartTime) {
		return domain.ErrValidation
	}

	return u.calendarRepo.Create(ctx, event)
}

func (u *CalendarUsecase) GetEvent(ctx context.Context, id string) (*domain.CalendarEvent, error) {
	return u.calendarRepo.GetByID(ctx, id)
}

func (u *CalendarUsecase) GetAllEvents(ctx context.Context, filter *domain.CalendarEventFilter) ([]domain.CalendarEvent, error) {
	events, err := u.calendarRepo.GetAll(ctx, filter)
	if err != nil {
		// Log the actual error for debugging
		fmt.Printf("[CalendarUsecase] GetAllEvents repo error: %v\n", err)
		return nil, err
	}
	fmt.Printf("[CalendarUsecase] GetAllEvents success: %d events\n", len(events))
	return events, nil
}

func (u *CalendarUsecase) GetActiveSessions(ctx context.Context) ([]domain.CalendarEvent, error) {
	return u.calendarRepo.GetActiveSessions(ctx)
}

func (u *CalendarUsecase) GetUpcomingEvents(ctx context.Context, days int) ([]domain.CalendarEvent, error) {
	now := time.Now()
	endDate := now.AddDate(0, 0, days)

	filter := &domain.CalendarEventFilter{
		StartDate: &now,
		EndDate:   &endDate,
	}

	return u.calendarRepo.GetAll(ctx, filter)
}

func (u *CalendarUsecase) UpdateEvent(ctx context.Context, event *domain.CalendarEvent) error {
	// Validate required fields
	if event.Title == "" {
		return domain.ErrValidation
	}
	if event.StartTime.IsZero() || event.EndTime.IsZero() {
		return domain.ErrValidation
	}
	if event.EndTime.Before(event.StartTime) {
		return domain.ErrValidation
	}

	return u.calendarRepo.Update(ctx, event)
}

func (u *CalendarUsecase) DeleteEvent(ctx context.Context, id string) error {
	return u.calendarRepo.Delete(ctx, id)
}

func (u *CalendarUsecase) SetActiveSession(ctx context.Context, id string, isActive bool) error {
	return u.calendarRepo.SetActiveSession(ctx, id, isActive)
}
