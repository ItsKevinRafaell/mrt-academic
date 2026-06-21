package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type stubEventRepo struct {
	events []domain.AcademicEvent
	err    error
}

func (s *stubEventRepo) Create(e *domain.AcademicEvent) error {
	e.ID = 1
	s.events = append(s.events, *e)
	return nil
}
func (s *stubEventRepo) GetAll() ([]domain.AcademicEvent, error) {
	return s.events, s.err
}
func (s *stubEventRepo) GetUpcoming() ([]domain.AcademicEvent, error) {
	return s.events, s.err
}
func (s *stubEventRepo) GetByID(id int) (*domain.AcademicEvent, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, e := range s.events {
		if e.ID == id {
			return &e, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (s *stubEventRepo) Update(e *domain.AcademicEvent) error { return nil }
func (s *stubEventRepo) Delete(id int) error                 { return nil }

func TestEventHandler_Create_Success(t *testing.T) {
	uc := usecase.NewEventUsecase(&stubEventRepo{})
	h := NewEventHandler(uc)

	body := `{"title":"UTS","description":"Ujian Tengah Semester","event_date":"2026-07-01","event_type":"exam"}`
	req := httptest.NewRequest("POST", "/api/v1/events", strings.NewReader(body))
	req = withAuthContext(req, "user1", "test@test.com", "ADMIN")
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.Create(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rr.Code)
	}
}

func TestEventHandler_GetAll_Success(t *testing.T) {
	repo := &stubEventRepo{
		events: []domain.AcademicEvent{
			{ID: 1, Title: "UTS", EventType: "exam"},
		},
	}
	uc := usecase.NewEventUsecase(repo)
	h := NewEventHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/events", nil)
	rr := httptest.NewRecorder()

	h.GetAll(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	resp := parseResponse(t, rr)
	if !resp.Success {
		t.Error("expected success true")
	}
}

func TestEventHandler_GetByID_NotFound(t *testing.T) {
	repo := &stubEventRepo{err: domain.ErrNotFound}
	uc := usecase.NewEventUsecase(repo)
	h := NewEventHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/events/999", nil)
	req.SetPathValue("id", "999")
	rr := httptest.NewRecorder()

	h.GetByID(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", rr.Code)
	}
}

func TestEventHandler_Delete_Forbidden(t *testing.T) {
	repo := &stubEventRepo{}
	uc := usecase.NewEventUsecase(repo)
	h := NewEventHandler(uc)

	req := httptest.NewRequest("DELETE", "/api/v1/events/1", nil)
	req = withAuthContext(req, "user1", "test@test.com", domain.RoleMahasiswa)
	req.SetPathValue("id", "1")
	rr := httptest.NewRecorder()

	h.Delete(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", rr.Code)
	}
}
