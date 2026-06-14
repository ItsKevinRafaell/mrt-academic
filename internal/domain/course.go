package domain

import "time"

type Course struct {
	ID          int      `json:"id"`
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	SKS         int      `json:"sks"`
	Description string   `json:"description"`
	Instructors []string `json:"instructors"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CourseRepository interface {
	Create(course *Course) error
	GetAll() ([]Course, error)
	GetByID(id int) (*Course, error)
	Update(course *Course) error
	Delete(id int) error
}
