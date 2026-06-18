package usecase

import (
	"mrt-backend/internal/domain"
)

type GradeUsecase struct {
	gradeRepo domain.GradeRepository
}

func NewGradeUsecase(gradeRepo domain.GradeRepository) *GradeUsecase {
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

func (u *GradeUsecase) GetGradesForCourse(userID string, courseID int) ([]domain.GradeComponentWithScore, error) {
	return u.gradeRepo.GetGradesForCourse(userID, courseID)
}

func (u *GradeUsecase) CreateBulkGrades(userID string, courseID int, grades []domain.BulkGradeInput) error {
	// Convert BulkGradeInput to domain.Grade
	var domainGrades []domain.Grade
	for _, g := range grades {
		letterGrade := u.convertScoreToGrade(g.Score)
		domainGrades = append(domainGrades, domain.Grade{
			UserID:      userID,
			CourseID:    courseID,
			ComponentID: g.ComponentID,
			Grade:       letterGrade,
			Score:       g.Score,
		})
	}
	return u.gradeRepo.CreateBulk(domainGrades)
}

func (u *GradeUsecase) convertScoreToGrade(score float64) string {
	switch {
	case score >= 85:
		return "A"
	case score >= 80:
		return "A-"
	case score >= 75:
		return "B+"
	case score >= 70:
		return "B"
	case score >= 65:
		return "B-"
	case score >= 60:
		return "C+"
	case score >= 55:
		return "C"
	case score >= 40:
		return "D"
	default:
		return "E"
	}
}

func (u *GradeUsecase) GetIPKData(userID string) ([]domain.IPKData, error) {
	return u.gradeRepo.GetIPKData(userID)
}
