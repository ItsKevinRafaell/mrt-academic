package usecase

import (
	"context"
	"errors"
	"testing"

	"mrt-backend/internal/domain"
)

type mockCourseRepo struct {
	courses map[int]*domain.Course
	nextID  int
}

func (m *mockCourseRepo) Create(ctx context.Context, c *domain.Course) error {
	if m.nextID == 0 {
		m.nextID = 1
	}
	c.ID = m.nextID
	m.courses[c.ID] = c
	m.nextID++
	return nil
}

func (m *mockCourseRepo) FindAll(ctx context.Context) ([]*domain.Course, error) {
	var result []*domain.Course
	for _, c := range m.courses {
		result = append(result, c)
	}
	return result, nil
}

func (m *mockCourseRepo) FindByID(ctx context.Context, id int) (*domain.Course, error) {
	c, ok := m.courses[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return c, nil
}

func (m *mockCourseRepo) Update(ctx context.Context, c *domain.Course) error {
	if _, ok := m.courses[c.ID]; !ok {
		return domain.ErrNotFound
	}
	m.courses[c.ID] = c
	return nil
}

func (m *mockCourseRepo) Delete(ctx context.Context, id int) error {
	if _, ok := m.courses[id]; !ok {
		return domain.ErrNotFound
	}
	delete(m.courses, id)
	return nil
}

func TestCourseUsecase_Create_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	req := CreateCourseRequest{
		Code: "CS101",
		Name: "Struktur Data",
		SKS:  3,
	}

	course, err := uc.Create(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if course.Code != "CS101" {
		t.Errorf("expected code CS101, got %s", course.Code)
	}
	if course.ID == 0 {
		t.Error("expected ID to be assigned")
	}
}

func TestCourseUsecase_Create_ValidationError(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	tests := []struct {
		name string
		req  CreateCourseRequest
	}{
		{"empty code", CreateCourseRequest{Code: "", Name: "Test", SKS: 3}},
		{"empty name", CreateCourseRequest{Code: "CS101", Name: "", SKS: 3}},
		{"invalid SKS", CreateCourseRequest{Code: "CS101", Name: "Test", SKS: 0}},
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

func TestCourseUsecase_GetAll_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	uc.Create(context.Background(), CreateCourseRequest{Code: "CS101", Name: "Struktur Data", SKS: 3})
	uc.Create(context.Background(), CreateCourseRequest{Code: "CS102", Name: "Algoritma", SKS: 3})

	courses, err := uc.GetAll(context.Background())

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(courses) != 2 {
		t.Errorf("expected 2 courses, got %d", len(courses))
	}
}

func TestCourseUsecase_GetByID_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateCourseRequest{Code: "CS101", Name: "Struktur Data", SKS: 3})

	course, err := uc.GetByID(context.Background(), created.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if course.Code != "CS101" {
		t.Errorf("expected code CS101, got %s", course.Code)
	}
}

func TestCourseUsecase_GetByID_NotFound(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	_, err := uc.GetByID(context.Background(), 999)

	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestCourseUsecase_Update_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateCourseRequest{Code: "CS101", Name: "Struktur Data", SKS: 3})

	updateReq := UpdateCourseRequest{
		Code: "CS102",
		Name: "Algoritma",
		SKS:  4,
	}

	course, err := uc.Update(context.Background(), created.ID, updateReq)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if course.Code != "CS102" {
		t.Errorf("expected code CS102, got %s", course.Code)
	}
	if course.SKS != 4 {
		t.Errorf("expected SKS 4, got %d", course.SKS)
	}
}

func TestCourseUsecase_Delete_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateCourseRequest{Code: "CS101", Name: "Struktur Data", SKS: 3})

	err := uc.Delete(context.Background(), created.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = uc.GetByID(context.Background(), created.ID)
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}
