package domain

import "time"

type Topic struct {
	ID          int       `json:"id"`
	CourseID    int       `json:"course_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	OrderNumber int       `json:"order_number"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TopicWithDetails struct {
	Topic
	CourseName    string       `json:"course_name"`
	Sessions      []Session    `json:"sessions"`
	Materials     []Material   `json:"materials"`
	Photos        []TopicPhoto `json:"photos"`
	SessionCount  int          `json:"session_count"`
	MaterialCount int          `json:"material_count"`
}

type TopicPhoto struct {
	ID        int       `json:"id"`
	TopicID   int       `json:"topic_id"`
	URL       string    `json:"url"`
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type TopicWithSessions struct {
	Topic
	Sessions []Session `json:"sessions"`
}
