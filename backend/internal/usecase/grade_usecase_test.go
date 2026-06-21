package usecase

import (
	"mrt-backend/internal/domain"
	"testing"
)

type mockGradeRepo struct {
	grades []domain.Grade
	gpa    *domain.GPASummary
}

func (m *mockGradeRepo) Create(grade *domain.Grade) error {
	m.grades = append(m.grades, *grade)
	return nil
}

func (m *mockGradeRepo) GetByUserID(userID string) ([]domain.Grade, error) {
	var result []domain.Grade
	for _, g := range m.grades {
		if g.UserID == userID {
			result = append(result, g)
		}
	}
	return result, nil
}

func (m *mockGradeRepo) CalculateGPA(userID string) (*domain.GPASummary, error) {
	return m.gpa, nil
}

func (m *mockGradeRepo) CreateBulk(grades []domain.Grade) error {
	m.grades = append(m.grades, grades...)
	return nil
}

func (m *mockGradeRepo) GetGradesForCourse(userID string, courseID int) ([]domain.GradeComponentWithScore, error) {
	return nil, nil
}

func (m *mockGradeRepo) GetIPKData(userID string) ([]domain.IPKData, error) {
	return nil, nil
}

func TestGradeUsecase_CreateGrade(t *testing.T) {
	mock := &mockGradeRepo{}
	uc := NewGradeUsecase(mock)

	err := uc.CreateGrade("user123", 1, "A")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(mock.grades) != 1 {
		t.Errorf("expected 1 grade, got %d", len(mock.grades))
	}
}

func TestGradeUsecase_GetUserGrades(t *testing.T) {
	mock := &mockGradeRepo{
		grades: []domain.Grade{
			{UserID: "user123", CourseID: 1, Grade: "A"},
			{UserID: "user123", CourseID: 2, Grade: "B"},
			{UserID: "user456", CourseID: 1, Grade: "A"},
		},
	}
	uc := NewGradeUsecase(mock)

	grades, err := uc.GetUserGrades("user123")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if len(grades) != 2 {
		t.Errorf("expected 2 grades, got %d", len(grades))
	}
}

func TestGradeUsecase_CalculateGPA(t *testing.T) {
	expected := &domain.GPASummary{
		CumulativeGPA: 3.5,
		TotalSKS:      10,
		PerCawu:       []domain.GPAPerCawu{},
	}
	mock := &mockGradeRepo{gpa: expected}
	uc := NewGradeUsecase(mock)

	gpa, err := uc.CalculateGPA("user123")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if gpa.CumulativeGPA != 3.5 {
		t.Errorf("expected GPA 3.5, got %f", gpa.CumulativeGPA)
	}
}
