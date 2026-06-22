package domain

import (
	"database/sql"
	"encoding/json"
	"time"
)

type NullInt64 struct {
	sql.NullInt64
}

func (n NullInt64) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return json.Marshal(nil)
	}
	return json.Marshal(n.Int64)
}

type Course struct {
	ID          int            `json:"id"`
	Code        string         `json:"code"`
	Name        string         `json:"name"`
	SKS         int            `json:"sks"`
	Description string         `json:"description"`
	CourseType  string         `json:"course_type"`
	CawuID      NullInt64      `json:"cawu_id"`
	Instructors []string       `json:"instructors"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type CourseRepository interface {
	Create(course *Course) error
	GetAll(page, limit int) ([]Course, int, error)
	GetByID(id int) (*Course, error)
	Update(course *Course) error
	Delete(id int) error
}
