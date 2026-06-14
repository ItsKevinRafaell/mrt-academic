package usecase

import (
	"context"
	"errors"
	"testing"

	"mrt-backend/internal/domain"
)

type mockGradeRepo struct {
	grades map[string]*domain.Grade
}

func (m *mockGradeRepo) Create(ctx context.Context, g *domain.Grade) error {
	key := g.UserID + ":" + string(rune(g.CourseID))
	m.grades[key] = g
	return nil
}

func (m *mockGradeRepo) FindByUserID(ctx context.Context, userID string) ([]*domain.Grade, error) {
	var result []*domain.Grade
	for key, g := range m.grades {
		if len(key) > 0 && key[:len(userID)] == userID {
			result = append(result, g)
		}
	}
	return result, nil
}

func (m *mockGradeRepo) FindByUserIDAndCourseID(ctx context.Context, userID string, courseID int) (*domain.Grade, error) {
	key := userID + ":" + string(rune(courseID))
	g, ok := m.grades[key]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return g, nil
}

func (m *mockGradeRepo) Update(ctx context.Context, g *domain.Grade) error {
	key := g.UserID + ":" + string(rune(g.CourseID))
	if _, ok := m.grades[key]; !ok {
		return domain.ErrNotFound
	}
	m.grades[key] = g
	return nil
}

func (m *mockGradeRepo) CalculateGPA(ctx context.Context, userID string) (*domain.GPASummary, error) {
	var totalWeightedGrade float64
	var totalSKS int

	for key, g := range m.grades {
		if len(key) > 0 && key[:len(userID)] == userID {
			gradeValue := g.Grade.ToFloat()
			totalWeightedGrade += gradeValue * float64(g.SKS)
			totalSKS += g.SKS
		}
	}

	gpa := 0.0
	if totalSKS > 0 {
		gpa = totalWeightedGrade / float64(totalSKS)
	}

	return &domain.GPASummary{
		GPA:       gpa,
		TotalSKS:  totalSKS,
		TotalGrade: totalWeightedGrade,
	}, nil
}

func TestGradeUsecase_Create_Success(t *testing.T) {
	mockRepo := &mockGradeRepo{grades: make(map[string]*domain.Grade)}
	uc := NewGradeUsecase(mockRepo)

	req := CreateGradeRequest{
		UserID:   "user123",
		CourseID: 1,
		Grade:    domain.GradeA,
		SKS:      3,
	}

	grade, err := uc.Create(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if grade.UserID != "user123" {
		t.Errorf("expected userID user123, got %s", grade.UserID)
	}
	if grade.Grade != domain.GradeA {
		t.Errorf("expected grade A, got %s", grade.Grade)
	}
}

func TestGradeUsecase_Create_ValidationError(t *testing.T) {
	mockRepo := &mockGradeRepo{grades: make(map[string]*domain.Grade)}
	uc := NewGradeUsecase(mockRepo)

	tests := []struct {
		name string
		req  CreateGradeRequest
	}{
		{"empty userID", CreateGradeRequest{UserID: "", CourseID: 1, Grade: domain.GradeA, SKS: 3}},
		{"invalid grade", CreateGradeRequest{UserID: "user123", CourseID: 1, Grade: "X", SKS: 3}},
		{"zero SKS", CreateGradeRequest{UserID: "user123", CourseID: 1, Grade: domain.GradeA, SKS: 0}},
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

func TestGradeUsecase_GetByUserID_Success(t *testing.T) {
	mockRepo := &mockGradeRepo{grades: make(map[string]*domain.Grade)}
	uc := NewGradeUsecase(mockRepo)

	uc.Create(context.Background(), CreateGradeRequest{UserID: "user123", CourseID: 1, Grade: domain.GradeA, SKS: 3})
	uc.Create(context.Background(), CreateGradeRequest{UserID: "user123", CourseID: 2, Grade: domain.GradeB, SKS: 3})

	grades, err := uc.GetByUserID(context.Background(), "user123")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(grades) != 2 {
		t.Errorf("expected 2 grades, got %d", len(grades))
	}
}

func TestGradeUsecase_CalculateGPA_Success(t *testing.T) {
	mockRepo := &mockGradeRepo{grades: make(map[string]*domain.Grade)}
	uc := NewGradeUsecase(mockRepo)

	uc.Create(context.Background(), CreateGradeRequest{UserID: "user123", CourseID: 1, Grade: domain.GradeA, SKS: 3})
	uc.Create(context.Background(), CreateGradeRequest{UserID: "user123", CourseID: 2, Grade: domain.GradeB, SKS: 3})

	summary, err := uc.CalculateGPA(context.Background(), "user123")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if summary.TotalSKS != 6 {
		t.Errorf("expected TotalSKS 6, got %d", summary.TotalSKS)
	}
	if summary.GPA == 0 {
		t.Error("expected GPA to be calculated")
	}
}

func TestGradeUsecase_Update_Success(t *testing.T) {
	mockRepo := &mockGradeRepo{grades: make(map[string]*domain.Grade)}
	uc := NewGradeUsecase(mockRepo)

	created, _ := uc.Create(context.Background(), CreateGradeRequest{UserID: "user123", CourseID: 1, Grade: domain.GradeA, SKS: 3})

	updateReq := UpdateGradeRequest{
		Grade: domain.GradeB,
		SKS:   3,
	}

	grade, err := uc.Update(context.Background(), created.ID, updateReq)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if grade.Grade != domain.GradeB {
		t.Errorf("expected grade B, got %s", grade.Grade)
	}
}
