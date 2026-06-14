package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type DashboardRepo struct {
	db *sql.DB
}

func NewDashboardRepo(db *sql.DB) *DashboardRepo {
	return &DashboardRepo{db: db}
}

func (r *DashboardRepo) GetSummary(userID string) (*domain.DashboardSummary, error) {
	summary := &domain.DashboardSummary{
		TotalCourses:     0,
		PendingTasks:     0,
		CompletedTasks:   0,
		UpcomingEvents:   []domain.AcademicEvent{},
		RecentActivities: []domain.Activity{},
	}

	courseQuery := `
		SELECT COUNT(*)
		FROM courses
	`
	err := r.db.QueryRow(courseQuery).Scan(&summary.TotalCourses)
	if err != nil {
		return nil, err
	}

	pendingQuery := `
		SELECT COUNT(*)
		FROM tasks t
		LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = $1
		WHERE tp.completed = false OR tp.completed IS NULL
	`
	err = r.db.QueryRow(pendingQuery, userID).Scan(&summary.PendingTasks)
	if err != nil {
		return nil, err
	}

	completedQuery := `
		SELECT COUNT(*)
		FROM task_progress
		WHERE user_id = $1 AND completed = true
	`
	err = r.db.QueryRow(completedQuery, userID).Scan(&summary.CompletedTasks)
	if err != nil {
		return nil, err
	}

	eventQuery := `
		SELECT id, title, description, event_date, event_type, created_at, updated_at
		FROM academic_events
		WHERE event_date >= CURRENT_DATE
		ORDER BY event_date ASC
		LIMIT 5
	`
	rows, err := r.db.Query(eventQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var e domain.AcademicEvent
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EventType, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			return nil, err
		}
		summary.UpcomingEvents = append(summary.UpcomingEvents, e)
	}

	activityQuery := `
		SELECT
			COALESCE(tp.completed_at, t.created_at) as timestamp,
			CASE
				WHEN tp.completed = true THEN 'completed_task'
				ELSE 'created_task'
			END as type,
			t.title,
			c.name as course_name
		FROM tasks t
		JOIN courses c ON t.course_id = c.id
		LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = $1
		WHERE tp.user_id = $1 OR tp.user_id IS NULL
		ORDER BY timestamp DESC
		LIMIT 10
	`
	actRows, err := r.db.Query(activityQuery, userID)
	if err != nil {
		return nil, err
	}
	defer actRows.Close()

	for actRows.Next() {
		var a domain.Activity
		err := actRows.Scan(&a.Timestamp, &a.Type, &a.Title, &a.CourseName)
		if err != nil {
			return nil, err
		}
		summary.RecentActivities = append(summary.RecentActivities, a)
	}

	return summary, actRows.Err()
}
