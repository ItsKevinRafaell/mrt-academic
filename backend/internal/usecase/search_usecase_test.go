package usecase

import (
	"mrt-backend/internal/domain"
	"testing"
	"time"
)

type mockSearchRepo struct {
	index *domain.SearchIndex
}

func (m *mockSearchRepo) GetIndex() (*domain.SearchIndex, error) {
	return m.index, nil
}

func (m *mockSearchRepo) Search(query string) (*domain.SearchIndex, error) {
	return m.index, nil
}

func (m *mockSearchRepo) RebuildCache() error {
	return nil
}

func TestSearchUsecase_GetIndex(t *testing.T) {
	expected := &domain.SearchIndex{
		Courses:  []domain.SearchItem{{ID: 1, Title: "Course 1"}},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}
	mock := &mockSearchRepo{index: expected}
	uc := NewSearchUsecase(mock, 5*time.Minute)

	index, err := uc.GetIndex()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(index.Courses) != 1 {
		t.Errorf("expected 1 course, got %d", len(index.Courses))
	}
}

func TestSearchUsecase_Search(t *testing.T) {
	expected := &domain.SearchIndex{
		Courses: []domain.SearchItem{
			{ID: 1, Title: "Data Structures"},
			{ID: 2, Title: "Algorithms"},
		},
	}
	mock := &mockSearchRepo{index: expected}
	uc := NewSearchUsecase(mock, 5*time.Minute)

	results, err := uc.Search("data")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(results.Courses) != 2 {
		t.Errorf("expected 2 courses, got %d", len(results.Courses))
	}
}
