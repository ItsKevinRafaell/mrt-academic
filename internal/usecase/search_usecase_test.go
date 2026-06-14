package usecase

import (
	"context"
	"testing"

	"mrt-backend/internal/domain"
)

type mockSearchRepo struct {
	data *domain.SearchIndex
}

func (m *mockSearchRepo) GetAll(ctx context.Context) (*domain.SearchIndex, error) {
	return m.data, nil
}

func TestSearchUsecase_GetAll_Success(t *testing.T) {
	mockData := &domain.SearchIndex{
		Courses: []domain.Course{
			{ID: 1, Code: "CS101", Name: "Struktur Data", SKS: 3},
		},
		Sessions: []domain.Session{
			{ID: 1, CourseID: 1, Title: "Introduction"},
		},
		Tasks: []domain.Task{
			{ID: 1, CourseID: 1, Title: "Assignment 1"},
		},
	}

	mockRepo := &mockSearchRepo{data: mockData}
	uc := NewSearchUsecase(mockRepo)

	index, err := uc.GetAll(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(index.Courses) != 1 {
		t.Errorf("expected 1 course, got %d", len(index.Courses))
	}
	if len(index.Sessions) != 1 {
		t.Errorf("expected 1 session, got %d", len(index.Sessions))
	}
	if len(index.Tasks) != 1 {
		t.Errorf("expected 1 task, got %d", len(index.Tasks))
	}
}

func TestSearchUsecase_Search_Success(t *testing.T) {
	mockData := &domain.SearchIndex{
		Courses: []domain.Course{
			{ID: 1, Code: "CS101", Name: "Struktur Data", SKS: 3},
			{ID: 2, Code: "CS102", Name: "Algoritma", SKS: 3},
		},
		Sessions: []domain.Session{
			{ID: 1, CourseID: 1, Title: "Introduction to Data Structures"},
		},
		Tasks: []domain.Task{
			{ID: 1, CourseID: 1, Title: "Data Structure Assignment"},
		},
	}

	mockRepo := &mockSearchRepo{data: mockData}
	uc := NewSearchUsecase(mockRepo)

	results, err := uc.Search(context.Background(), "data")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(results.Courses) != 1 {
		t.Errorf("expected 1 course matching 'data', got %d", len(results.Courses))
	}
	if len(results.Sessions) != 1 {
		t.Errorf("expected 1 session matching 'data', got %d", len(results.Sessions))
	}
	if len(results.Tasks) != 1 {
		t.Errorf("expected 1 task matching 'data', got %d", len(results.Tasks))
	}
}

func TestSearchUsecase_Search_NoResults(t *testing.T) {
	mockData := &domain.SearchIndex{
		Courses: []domain.Course{
			{ID: 1, Code: "CS101", Name: "Struktur Data", SKS: 3},
		},
	}

	mockRepo := &mockSearchRepo{data: mockData}
	uc := NewSearchUsecase(mockRepo)

	results, err := uc.Search(context.Background(), "nonexistent")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(results.Courses) != 0 {
		t.Errorf("expected 0 courses, got %d", len(results.Courses))
	}
}
