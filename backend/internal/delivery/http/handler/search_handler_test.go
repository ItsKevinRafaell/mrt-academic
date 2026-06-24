package handler

import (
	"mrt-backend/internal/domain"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"mrt-backend/internal/usecase"
)

type mockSearchRepo struct {
	index *domain.SearchIndex
	err   error
}

func (m *mockSearchRepo) GetIndex() (*domain.SearchIndex, error) {
	return m.index, m.err
}

func (m *mockSearchRepo) Search(query string) (*domain.SearchIndex, error) {
	return m.index, m.err
}

func (m *mockSearchRepo) RebuildCache() error {
	return nil
}

func TestSearchHandler_GetIndex_Success(t *testing.T) {
	index := &domain.SearchIndex{
		Courses:  []domain.SearchItem{{ID: 1, Title: "CS101", Type: "course"}},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}
	mock := &mockSearchRepo{index: index}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index", nil)
	w := httptest.NewRecorder()

	su := usecase.NewSearchUsecase(mock, 5*time.Minute)
	h := NewSearchHandler(su)

	h.GetIndex(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestSearchHandler_GetIndex_Error(t *testing.T) {
	mock := &mockSearchRepo{err: domain.ErrInternal}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index", nil)
	w := httptest.NewRecorder()

	su := usecase.NewSearchUsecase(mock, 5*time.Minute)
	h := NewSearchHandler(su)

	h.GetIndex(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

func TestSearchHandler_Search_Success(t *testing.T) {
	index := &domain.SearchIndex{
		Courses:  []domain.SearchItem{{ID: 1, Title: "CS101", Type: "course"}},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}
	mock := &mockSearchRepo{index: index}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index?q=CS101", nil)
	w := httptest.NewRecorder()

	su := usecase.NewSearchUsecase(mock, 5*time.Minute)
	h := NewSearchHandler(su)

	h.Search(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestSearchHandler_Search_MissingQuery(t *testing.T) {
	mock := &mockSearchRepo{}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search", nil)
	w := httptest.NewRecorder()

	su := usecase.NewSearchUsecase(mock, 5*time.Minute)
	h := NewSearchHandler(su)

	h.Search(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestSearchHandler_Search_Error(t *testing.T) {
	mock := &mockSearchRepo{err: domain.ErrInternal}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index?q=test", nil)
	w := httptest.NewRecorder()

	su := usecase.NewSearchUsecase(mock, 5*time.Minute)
	h := NewSearchHandler(su)

	h.Search(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}
