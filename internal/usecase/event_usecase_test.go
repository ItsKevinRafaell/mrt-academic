package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"mrt-backend/internal/domain"
)

type mockEventRepo struct {
	events map[int]*domain.Event
	nextID int
}

func (m *mockEventRepo) Create(ctx context.Context, e *domain.Event) error {
	if m.nextID == 0 {
		m.nextID = 1
	}
	e.ID = m.nextID
	m.events[e.ID] = e
	m.nextID++
	return nil
}

func (m *mockEventRepo) FindAll(ctx context.Context) ([]*domain.Event, error) {
	var result []*domain.Event
	for _, e := range m.events {
		result = append(result, e)
	}
	return result, nil
}

func (m *mockEventRepo) FindByID(ctx context.Context, id int) (*domain.Event, error) {
	e, ok := m.events[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return e, nil
}

func (m *mockEventRepo) FindUpcoming(ctx context.Context) ([]*domain.Event, error) {
	now := time.Now()
	var result []*domain.Event
	for _, e := range m.events {
		if e.StartDate.After(now) {
			result = append(result, e)
		}
	}
	return result, nil
}

func (m *mockEventRepo) Update(ctx context.Context, e *domain.Event) error {
	if _, ok := m.events[e.ID]; !ok {
		return domain.ErrNotFound
	}
	m.events[e.ID] = e
	return nil
}

func (m *mockEventRepo) Delete(ctx context.Context, id int) error {
	if _, ok := m.events[id]; !ok {
		return domain.ErrNotFound
	}
	delete(m.events, id)
	return nil
}

func TestEventUsecase_Create_Success(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	req := CreateEventRequest{
		Title:       "UAS",
		Description: "Ujian Akhir Semester",
		StartDate:   time.Now().Add(7 * 24 * time.Hour),
		EndDate:     time.Now().Add(7*24*time.Hour + 2*time.Hour),
	}

	event, err := uc.Create(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if event.Title != "UAS" {
		t.Errorf("expected title UAS, got %s", event.Title)
	}
	if event.ID == 0 {
		t.Error("expected ID to be assigned")
	}
}

func TestEventUsecase_Create_ValidationError(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	tests := []struct {
		name string
		req  CreateEventRequest
	}{
		{"empty title", CreateEventRequest{Title: "", StartDate: time.Now(), EndDate: time.Now().Add(time.Hour)}},
		{"end before start", CreateEventRequest{Title: "Test", StartDate: time.Now().Add(time.Hour), EndDate: time.Now()}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := uc.Create(context.Background(), tt.req)
			if !errors.Is(err, domain.ErrValidation) {
				t.Errorf("expected ErrValidation, got %v", err)
			}
		})
	}
}

func TestEventUsecase_GetAll_Success(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	uc.Create(context.Background(), CreateEventRequest{
		Title:     "UTS",
		StartDate: time.Now().Add(24 * time.Hour),
		EndDate:   time.Now().Add(24*time.Hour + 2*time.Hour),
	})
	uc.Create(context.Background(), CreateEventRequest{
		Title:     "UAS",
		StartDate: time.Now().Add(7 * 24 * time.Hour),
		EndDate:   time.Now().Add(7*24*time.Hour + 2*time.Hour),
	})

	events, err := uc.GetAll(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(events) != 2 {
		t.Errorf("expected 2 events, got %d", len(events))
	}
}

func TestEventUsecase_GetUpcoming_Success(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	uc.Create(context.Background(), CreateEventRequest{
		Title:     "Past Event",
		StartDate: time.Now().Add(-24 * time.Hour),
		EndDate:   time.Now().Add(-24*time.Hour + 2*time.Hour),
	})
	uc.Create(context.Background(), CreateEventRequest{
		Title:     "Future Event",
		StartDate: time.Now().Add(24 * time.Hour),
		EndDate:   time.Now().Add(24*time.Hour + 2*time.Hour),
	})

	events, err := uc.GetUpcoming(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(events) != 1 {
		t.Errorf("expected 1 upcoming event, got %d", len(events))
	}
}

func TestEventUsecase_Update_Success(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateEventRequest{
		Title:     "UTS",
		StartDate: time.Now().Add(24 * time.Hour),
		EndDate:   time.Now().Add(24*time.Hour + 2*time.Hour),
	})

	updateReq := UpdateEventRequest{
		Title:       "UAS",
		Description: "Updated description",
	}

	event, err := uc.Update(context.Background(), created.ID, updateReq)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if event.Title != "UAS" {
		t.Errorf("expected title UAS, got %s", event.Title)
	}
}

func TestEventUsecase_Delete_Success(t *testing.T) {
	mockRepo := &mockEventRepo{events: make(map[int]*domain.Event)}
	uc := NewEventUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateEventRequest{
		Title:     "UTS",
		StartDate: time.Now().Add(24 * time.Hour),
		EndDate:   time.Now().Add(24*time.Hour + 2*time.Hour),
	})

	err := uc.Delete(context.Background(), created.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = uc.GetByID(context.Background(), created.ID)
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}
