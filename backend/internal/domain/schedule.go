package domain

import "time"

type Schedule struct {
	ID        int       `json:"id"`
	CourseID  int       `json:"course_id"`
	DayOfWeek int       `json:"day_of_week"`
	StartTime string    `json:"start_time"`
	EndTime   string    `json:"end_time"`
	SessionID *int      `json:"session_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ScheduleWithCourse struct {
	Schedule
	CourseCode string `json:"course_code"`
	CourseName string `json:"course_name"`
}

type ScheduleRepository interface {
	Create(schedule *Schedule) error
	GetAll() ([]ScheduleWithCourse, error)
	GetByCourseID(courseID int) ([]Schedule, error)
	GetByID(id int) (*ScheduleWithCourse, error)
	GetActive(dayOfWeek int, currentTime string) ([]ScheduleWithCourse, error)
	Update(schedule *Schedule) error
	Delete(id int) error
}
