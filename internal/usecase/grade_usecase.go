package usecase

import (
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
)

type GradeUsecase struct {
	gradeRepo *postgres.GradeRepo
}

func NewGradeUsecase(gradeRepo *postgres.GradeRepo) *GradeUsecase {
	return &GradeUsecase{gradeRepo: gradeRepo}
}

func (u *GradeUsecase) CreateGrade(userID string, courseID int, grade string) error {
	g := &domain.Grade{
		UserID:   userID,
		CourseID: courseID,
		Grade:    grade,
	}
	return u.gradeRepo.Create(g)
}

func (u *GradeUsecase) GetUserGrades(userID string) ([]domain.Grade, error) {
	return u.gradeRepo.GetByUserID(userID)
}

func (u *GradeUsecase) CalculateGPA(userID string) (*domain.GPASummary, error) {
	return u.gradeRepo.CalculateGPA(userID)
}
