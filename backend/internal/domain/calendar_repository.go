package domain

import "context"

// CalendarEventRepository defines the interface for calendar event persistence
type CalendarEventRepository interface {
	Create(ctx context.Context, event *CalendarEvent) error
	GetByID(ctx context.Context, id string) (*CalendarEvent, error)
	GetAll(ctx context.Context, filter *CalendarEventFilter) ([]CalendarEvent, error)
	GetActiveSessions(ctx context.Context) ([]CalendarEvent, error)
	Update(ctx context.Context, event *CalendarEvent) error
	Delete(ctx context.Context, id string) error
	SetActiveSession(ctx context.Context, id string, isActive bool) error
}
