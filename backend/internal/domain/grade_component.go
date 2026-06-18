package domain

import "time"

type GradeComponent struct {
	ID        int       `json:"id"`
	CourseID  int       `json:"course_id"`
	Name      string    `json:"name"` // e.g., "UAP", "UAC", "UTC", "Lab", "Lecture"
	Weight    float64   `json:"weight"` // percentage (0-100)
	Type      string    `json:"type"` // e.g., "lecture", "lab", "assignment"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GradeComponentRepository interface {
	Create(gc *GradeComponent) error
	GetByCourseID(courseID int) ([]GradeComponent, error)
	Update(gc *GradeComponent) error
	Delete(id int) error
	GetByID(id int) (*GradeComponent, error)
}
