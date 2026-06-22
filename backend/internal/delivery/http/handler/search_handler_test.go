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

	su := NewSearchUsecaseForTest(mock)
	h := NewSearchHandler(su)

	h.GetIndex(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
	if w.Header().Get("ETag") == "" {
		t.Error("expected ETag header to be set")
	}
}

func TestSearchHandler_GetIndex_NotModified(t *testing.T) {
	index := &domain.SearchIndex{
		Courses:  []domain.SearchItem{{ID: 1, Title: "CS101", Type: "course"}},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}
	mock := &mockSearchRepo{index: index}
	su := NewSearchUsecaseForTest(mock)
	h := NewSearchHandler(su)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index", nil)
	w1 := httptest.NewRecorder()
	h.GetIndex(w1, req)
	actualETag := w1.Header().Get("ETag")

	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/search/index", nil)
	req2.Header.Set("If-None-Match", actualETag)
	w2 := httptest.NewRecorder()

	h.GetIndex(w2, req2)

	if w2.Code != http.StatusNotModified {
		t.Errorf("expected status 304, got %d", w2.Code)
	}
}

func TestSearchHandler_GetIndex_Error(t *testing.T) {
	mock := &mockSearchRepo{err: domain.ErrInternal}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/search/index", nil)
	w := httptest.NewRecorder()

	su := NewSearchUsecaseForTest(mock)
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

	su := NewSearchUsecaseForTest(mock)
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

	su := NewSearchUsecaseForTest(mock)
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

	su := NewSearchUsecaseForTest(mock)
	h := NewSearchHandler(su)

	h.Search(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}
}

type testSearchUsecase struct {
	repo domain.SearchRepository
}

func NewSearchUsecaseForTest(repo domain.SearchRepository) *testSearchUsecase {
	return &testSearchUsecase{repo: repo}
}

func (u *testSearchUsecase) GetIndex() (*domain.SearchIndex, error) {
	return u.repo.GetIndex()
}

func (u *testSearchUsecase) Search(query string) (*domain.SearchIndex, error) {
	return u.repo.Search(query)
}

func (u *testSearchUsecase) InvalidateCache() error {
	return nil
}

func TestSearchUsecase_InvalidateCache(t *testing.T) {
	mock := &mockSearchRepo{index: &domain.SearchIndex{}}
	uc := usecase.NewSearchUsecase(mock, 5*time.Minute)

	err := uc.InvalidateCache()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}
