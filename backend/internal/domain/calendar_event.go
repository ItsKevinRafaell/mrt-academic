package domain

import (
	"time"
)

// CalendarEvent represents an academic calendar event with optional course bindings
type CalendarEvent struct {
	ID                  string     `json:"id"`
	Title               string     `json:"title"`
	Description         string     `json:"description"`
	EventType           string     `json:"event_type"` // class, exam, meeting, deadline, holiday
	StartTime           time.Time  `json:"start_time"`
	EndTime             time.Time  `json:"end_time"`
	IsRecurring         bool       `json:"is_recurring"`
	RecurrencePattern   string     `json:"recurrence_pattern,omitempty"` // daily, weekly, monthly
	CourseID            *int       `json:"course_id,omitempty"`
	TopicID             *int       `json:"topic_id,omitempty"`
	SessionID           *int       `json:"session_id,omitempty"`
	IsActiveSession     bool       `json:"is_active_session"`
	WeekParity          *string    `json:"week_parity,omitempty"`
	CreatedBy           string     `json:"created_by"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`

	// Optional: joined data for responses
	CourseName          string     `json:"course_name,omitempty"`
	TopicTitle          string     `json:"topic_title,omitempty"`
	SessionTitle        string     `json:"session_title,omitempty"`
	CreatorName         string     `json:"creator_name,omitempty"`
}

// CalendarEventFilter for querying events
type CalendarEventFilter struct {
	StartDate   *time.Time
	EndDate     *time.Time
	EventType   string
	CourseID    int
	IsActive    *bool
	CreatedBy   string
}
