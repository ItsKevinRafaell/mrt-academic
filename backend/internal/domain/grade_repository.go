package domain

type GradeRepository interface {
	Create(grade *Grade) error
	CreateBulk(grades []Grade) error
	GetByUserID(userID string) ([]Grade, error)
	GetGradesForCourse(userID string, courseID int) ([]GradeComponentWithScore, error)
	CalculateGPA(userID string) (*GPASummary, error)
	GetIPKData(userID string) ([]IPKData, error)
}
