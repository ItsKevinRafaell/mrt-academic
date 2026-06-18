package usecase

import (
	"mrt-backend/internal/domain"
	"testing"
	"time"
)

type mockEventRepo struct {
	events []domain.AcademicEvent
}

func (m *mockEventRepo) Create(event *domain.AcademicEvent) error {
	event.ID = len(m.events) + 1
	m.events = append(m.events, *event)
	return nil
}

func (m *mockEventRepo) GetAll() ([]domain.AcademicEvent, error) {
	return m.events, nil
}

func (m *mockEventRepo) GetUpcoming() ([]domain.AcademicEvent, error) {
	now := time.Now()
	var result []domain.AcademicEvent
	for _, e := range m.events {
		if e.EventDate.After(now) {
			result = append(result, e)
		}
	}
	return result, nil
}

func (m *mockEventRepo) GetByID(id int) (*domain.AcademicEvent, error) {
	for _, e := range m.events {
		if e.ID == id {
			return &e, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *mockEventRepo) Update(event *domain.AcademicEvent) error {
	for i, e := range m.events {
		if e.ID == event.ID {
			m.events[i] = *event
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *mockEventRepo) Delete(id int) error {
	for i, e := range m.events {
		if e.ID == id {
			m.events = append(m.events[:i], m.events[i+1:]...)
			return nil
		}
	}
	return domain.ErrNotFound
}

func TestEventUsecase_CreateEvent(t *testing.T) {
	mock := &mockEventRepo{}
	uc := NewEventUsecase(mock)

	event, err := uc.CreateEvent("Test Event", "Description", "exam", time.Now().Add(24*time.Hour))
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if event.ID != 1 {
		t.Errorf("expected ID 1, got %d", event.ID)
	}
	if event.Title != "Test Event" {
		t.Errorf("expected title 'Test Event', got %s", event.Title)
	}
}

func TestEventUsecase_GetAllEvents(t *testing.T) {
	mock := &mockEventRepo{
		events: []domain.AcademicEvent{
			{ID: 1, Title: "Event 1"},
			{ID: 2, Title: "Event 2"},
		},
	}
	uc := NewEventUsecase(mock)

	events, err := uc.GetAllEvents()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(events) != 2 {
		t.Errorf("expected 2 events, got %d", len(events))
	}
}

func TestEventUsecase_GetUpcomingEvents(t *testing.T) {
	future := time.Now().Add(24 * time.Hour)
	past := time.Now().Add(-24 * time.Hour)

	mock := &mockEventRepo{
		events: []domain.AcademicEvent{
			{ID: 1, Title: "Future Event", EventDate: future},
			{ID: 2, Title: "Past Event", EventDate: past},
		},
	}
	uc := NewEventUsecase(mock)

	events, err := uc.GetUpcomingEvents()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(events) != 1 {
		t.Errorf("expected 1 upcoming event, got %d", len(events))
	}
}

func TestEventUsecase_DeleteEvent(t *testing.T) {
	mock := &mockEventRepo{
		events: []domain.AcademicEvent{
			{ID: 1, Title: "Event 1"},
			{ID: 2, Title: "Event 2"},
		},
	}
	uc := NewEventUsecase(mock)

	err := uc.DeleteEvent(1)
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(mock.events) != 1 {
		t.Errorf("expected 1 event after delete, got %d", len(mock.events))
	}
}
