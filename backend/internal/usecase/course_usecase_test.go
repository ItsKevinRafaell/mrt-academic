package usecase

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"mrt-backend/internal/domain"
)

type mockCourseRepo struct {
	courses map[int]*domain.Course
	nextID  int
}

func (m *mockCourseRepo) Create(c *domain.Course) error {
	if m.nextID == 0 {
		m.nextID = 1
	}
	c.ID = m.nextID
	m.courses[c.ID] = c
	m.nextID++
	return nil
}

func (m *mockCourseRepo) GetAll() ([]domain.Course, error) {
	var result []domain.Course
	for _, c := range m.courses {
		result = append(result, *c)
	}
	return result, nil
}

func (m *mockCourseRepo) GetByID(id int) (*domain.Course, error) {
	c, ok := m.courses[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return c, nil
}

func (m *mockCourseRepo) Update(c *domain.Course) error {
	if _, ok := m.courses[c.ID]; !ok {
		return sql.ErrNoRows
	}
	m.courses[c.ID] = c
	return nil
}

func (m *mockCourseRepo) Delete(id int) error {
	if _, ok := m.courses[id]; !ok {
		return sql.ErrNoRows
	}
	delete(m.courses, id)
	return nil
}

type mockSessionRepo struct{}

func (m *mockSessionRepo) Create(s *domain.Session) error              { return nil }
func (m *mockSessionRepo) GetByCourseID(courseID int) ([]domain.Session, error) {
	return nil, nil
}
func (m *mockSessionRepo) GetByID(id int) (*domain.Session, error) {
	return nil, nil
}
func (m *mockSessionRepo) Update(s *domain.Session) error { return nil }
func (m *mockSessionRepo) Delete(id int) error            { return nil }

type mockMaterialRepo struct{}

func (m *mockMaterialRepo) Create(mat *domain.Material) error { return nil }
func (m *mockMaterialRepo) GetByCourseID(courseID int) ([]domain.SessionWithMaterials, error) {
	return nil, nil
}
func (m *mockMaterialRepo) GetBySessionID(sessionID int) ([]domain.Material, error) {
	return nil, nil
}
func (m *mockMaterialRepo) GetByID(id int) (*domain.Material, error) { return nil, nil }
func (m *mockMaterialRepo) Update(mat *domain.Material) error        { return nil }
func (m *mockMaterialRepo) Delete(id int) error                      { return nil }

type mockTaskRepo struct{}

func (m *mockTaskRepo) Create(t *domain.Task) error                       { return nil }
func (m *mockTaskRepo) GetByCourseID(courseID int) ([]domain.Task, error) { return nil, nil }
func (m *mockTaskRepo) GetByID(id int) (*domain.Task, error)              { return nil, nil }
func (m *mockTaskRepo) Update(t *domain.Task) error                       { return nil }
func (m *mockTaskRepo) Delete(id int) error                               { return nil }
func (m *mockTaskRepo) UpdateProgress(p *domain.TaskProgress) error       { return nil }
func (m *mockTaskRepo) GetProgressByUserID(userID string) ([]domain.TaskProgress, error) {
	return nil, nil
}
func (m *mockTaskRepo) GetProgressByTaskID(taskID int) ([]domain.TaskProgress, error) {
	return nil, nil
}
func (m *mockTaskRepo) GetProgressWithUsersByTaskID(taskID int) ([]domain.TaskProgressWithUser, error) {
	return nil, nil
}
func (m *mockTaskRepo) GetTotalUserCount() (int, error)                  { return 0, nil }
func (m *mockTaskRepo) GetTaskDetail(taskID int) (*domain.TaskDetailResponse, error) {
	return nil, nil
}

func TestCourseUsecase_Create_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo, &mockSessionRepo{}, &mockMaterialRepo{}, &mockTaskRepo{})

	course := &domain.Course{
		Code: "CS101",
		Name: "Struktur Data",
		SKS:  3,
	}

	err := uc.Create(context.Background(), course)

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
	uc := NewCourseUsecase(mockRepo, &mockSessionRepo{}, &mockMaterialRepo{}, &mockTaskRepo{})

	tests := []struct {
		name   string
		course *domain.Course
	}{
		{"empty code", &domain.Course{Code: "", Name: "Test", SKS: 3}},
		{"empty name", &domain.Course{Code: "CS101", Name: "", SKS: 3}},
		{"invalid SKS", &domain.Course{Code: "CS101", Name: "Test", SKS: 0}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := uc.Create(context.Background(), tt.course)
			if !errors.Is(err, domain.ErrValidation) {
				t.Errorf("expected ErrValidation, got %v", err)
			}
		})
	}
}

func TestCourseUsecase_GetAll_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo, &mockSessionRepo{}, &mockMaterialRepo{}, &mockTaskRepo{})

	uc.Create(context.Background(), &domain.Course{Code: "CS101", Name: "Struktur Data", SKS: 3})
	uc.Create(context.Background(), &domain.Course{Code: "CS102", Name: "Algoritma", SKS: 3})

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
	uc := NewCourseUsecase(mockRepo, &mockSessionRepo{}, &mockMaterialRepo{}, &mockTaskRepo{})

	created := &domain.Course{Code: "CS101", Name: "Struktur Data", SKS: 3}
	uc.Create(context.Background(), created)

	course, err := uc.GetByID(context.Background(), created.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if course.Code != "CS101" {
		t.Errorf("expected code CS101, got %s", course.Code)
	}
}

func TestCourseUsecase_Delete_Success(t *testing.T) {
	mockRepo := &mockCourseRepo{courses: make(map[int]*domain.Course)}
	uc := NewCourseUsecase(mockRepo, &mockSessionRepo{}, &mockMaterialRepo{}, &mockTaskRepo{})

	created := &domain.Course{Code: "CS101", Name: "Struktur Data", SKS: 3}
	uc.Create(context.Background(), created)

	err := uc.Delete(context.Background(), created.ID)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = uc.GetByID(context.Background(), created.ID)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}
