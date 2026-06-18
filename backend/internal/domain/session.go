package domain

import "time"

type Session struct {
	ID          int      `json:"id"`
	CourseID    int      `json:"course_id"`
	Number      int      `json:"number"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	TopicID     *int     `json:"topic_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SessionWithMaterials struct {
	Session
	Materials []Material
}

type SessionRepository interface {
	Create(session *Session) error
	GetByCourseID(courseID int) ([]Session, error)
	GetByID(id int) (*Session, error)
	Update(session *Session) error
	Delete(id int) error
}
