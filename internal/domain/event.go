package domain

import "time"

type AcademicEvent struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventDate   time.Time `json:"event_date"`
	EventType   string    `json:"event_type"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Activity struct {
	Timestamp  time.Time `json:"timestamp"`
	Type       string    `json:"type"`
	Title      string    `json:"title"`
	CourseName string    `json:"course_name"`
}

type DashboardSummary struct {
	TotalCourses     int             `json:"total_courses"`
	PendingTasks     int             `json:"pending_tasks"`
	CompletedTasks   int             `json:"completed_tasks"`
	UpcomingEvents   []AcademicEvent `json:"upcoming_events"`
	RecentActivities []Activity      `json:"recent_activities"`
}
