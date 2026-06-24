package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type CalendarEventRepo struct {
	db *sql.DB
}

func NewCalendarEventRepo(db *sql.DB) *CalendarEventRepo {
	return &CalendarEventRepo{db: db}
}

func (r *CalendarEventRepo) Create(ctx context.Context, event *domain.CalendarEvent) error {
	query := `
		INSERT INTO calendar_events (
			id, title, description, event_type, start_time, end_time,
			is_recurring, recurrence_pattern, course_id, topic_id, session_id,
			is_active_session, created_by, week_parity
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at, updated_at
	`

	return r.db.QueryRowContext(ctx, query,
		event.ID,
		event.Title,
		event.Description,
		event.EventType,
		event.StartTime,
		event.EndTime,
		event.IsRecurring,
		event.RecurrencePattern,
		event.CourseID,
		event.TopicID,
		event.SessionID,
		event.IsActiveSession,
		event.CreatedBy,
		event.WeekParity,
	).Scan(&event.CreatedAt, &event.UpdatedAt)
}

func (r *CalendarEventRepo) UserExists(ctx context.Context, userID string) (bool, error) {
	const query = `SELECT 1 FROM users WHERE id = $1`
	var exists int
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *CalendarEventRepo) GetByID(ctx context.Context, id string) (*domain.CalendarEvent, error) {
	query := `
		SELECT
			ce.id, ce.title, ce.description, ce.event_type, ce.start_time, ce.end_time,
			ce.is_recurring, ce.recurrence_pattern, ce.course_id, ce.topic_id, ce.session_id,
			ce.is_active_session, ce.created_by, ce.created_at, ce.updated_at,
			COALESCE(c.name, '') as course_name,
			COALESCE(t.title, '') as topic_title,
			COALESCE(s.title, '') as session_title,
			COALESCE(u.full_name, '') as creator_name,
			ce.week_parity
		FROM calendar_events ce
		LEFT JOIN courses c ON ce.course_id = c.id
		LEFT JOIN topics t ON ce.topic_id = t.id
		LEFT JOIN sessions s ON ce.session_id = s.id
		LEFT JOIN users u ON ce.created_by = u.id
		WHERE ce.id = $1
	`

	event := &domain.CalendarEvent{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.EventType,
		&event.StartTime,
		&event.EndTime,
		&event.IsRecurring,
		&event.RecurrencePattern,
		&event.CourseID,
		&event.TopicID,
		&event.SessionID,
		&event.IsActiveSession,
		&event.CreatedBy,
		&event.CreatedAt,
		&event.UpdatedAt,
		&event.CourseName,
		&event.TopicTitle,
		&event.SessionTitle,
		&event.CreatorName,
		&event.WeekParity,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return event, err
}

func (r *CalendarEventRepo) GetAll(ctx context.Context, filter *domain.CalendarEventFilter) ([]domain.CalendarEvent, error) {
	query := `
		SELECT
			ce.id, ce.title, ce.description, ce.event_type, ce.start_time, ce.end_time,
			ce.is_recurring, ce.recurrence_pattern, ce.course_id, ce.topic_id, ce.session_id,
			ce.is_active_session, ce.created_by, ce.created_at, ce.updated_at,
			COALESCE(c.name, '') as course_name,
			COALESCE(t.title, '') as topic_title,
			COALESCE(s.title, '') as session_title,
			COALESCE(u.full_name, '') as creator_name,
			ce.week_parity
		FROM calendar_events ce
		LEFT JOIN courses c ON ce.course_id = c.id
		LEFT JOIN topics t ON ce.topic_id = t.id
		LEFT JOIN sessions s ON ce.session_id = s.id
		LEFT JOIN users u ON ce.created_by = u.id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if filter != nil {
		if filter.StartDate != nil {
			query += fmt.Sprintf(" AND ce.start_time >= $%d", argCount)
			args = append(args, *filter.StartDate)
			argCount++
		}
		if filter.EndDate != nil {
			query += fmt.Sprintf(" AND ce.end_time <= $%d", argCount)
			args = append(args, *filter.EndDate)
			argCount++
		}
		if filter.EventType != "" {
			query += fmt.Sprintf(" AND ce.event_type = $%d", argCount)
			args = append(args, filter.EventType)
			argCount++
		}
		if filter.CourseID > 0 {
			query += fmt.Sprintf(" AND ce.course_id = $%d", argCount)
			args = append(args, filter.CourseID)
			argCount++
		}
		if filter.IsActive != nil {
			query += fmt.Sprintf(" AND ce.is_active_session = $%d", argCount)
			args = append(args, *filter.IsActive)
			argCount++
		}
		if filter.CreatedBy != "" {
			query += fmt.Sprintf(" AND ce.created_by = $%d", argCount)
			args = append(args, filter.CreatedBy)
			argCount++
		}
	}

	query += " ORDER BY ce.start_time ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []domain.CalendarEvent
	for rows.Next() {
		var e domain.CalendarEvent
		var courseID, topicID, sessionID sql.NullInt64
		var courseName, topicTitle, sessionTitle, creatorName, recurrencePattern sql.NullString

		err := rows.Scan(
			&e.ID,
			&e.Title,
			&e.Description,
			&e.EventType,
			&e.StartTime,
			&e.EndTime,
			&e.IsRecurring,
			&recurrencePattern,
			&courseID,
			&topicID,
			&sessionID,
			&e.IsActiveSession,
			&e.CreatedBy,
			&e.CreatedAt,
			&e.UpdatedAt,
			&courseName,
			&topicTitle,
			&sessionTitle,
			&creatorName,
			&e.WeekParity,
		)
		if err != nil {
			fmt.Printf("[CalendarRepo] Scan error: %v\n", err)
			return nil, err
		}

		// Handle nullable fields
		if recurrencePattern.Valid {
			e.RecurrencePattern = recurrencePattern.String
		}
		if courseID.Valid {
			cid := int(courseID.Int64)
			e.CourseID = &cid
		}
		if topicID.Valid {
			tid := int(topicID.Int64)
			e.TopicID = &tid
		}
		if sessionID.Valid {
			sid := int(sessionID.Int64)
			e.SessionID = &sid
		}
		if courseName.Valid {
			e.CourseName = courseName.String
		}
		if topicTitle.Valid {
			e.TopicTitle = topicTitle.String
		}
		if sessionTitle.Valid {
			e.SessionTitle = sessionTitle.String
		}
		if creatorName.Valid {
			e.CreatorName = creatorName.String
		}

		events = append(events, e)
	}

	return events, rows.Err()
}

func (r *CalendarEventRepo) GetActiveSessions(ctx context.Context) ([]domain.CalendarEvent, error) {
	now := time.Now()
	query := `
		SELECT
			ce.id, ce.title, ce.description, ce.event_type, ce.start_time, ce.end_time,
			ce.is_recurring, ce.recurrence_pattern, ce.course_id, ce.topic_id, ce.session_id,
			ce.is_active_session, ce.created_by, ce.created_at, ce.updated_at,
			COALESCE(c.name, '') as course_name,
			COALESCE(t.title, '') as topic_title,
			COALESCE(s.title, '') as session_title,
			COALESCE(u.full_name, '') as creator_name,
			ce.week_parity
		FROM calendar_events ce
		LEFT JOIN courses c ON ce.course_id = c.id
		LEFT JOIN topics t ON ce.topic_id = t.id
		LEFT JOIN sessions s ON ce.session_id = s.id
		LEFT JOIN users u ON ce.created_by = u.id
		WHERE ce.event_type = 'class'
			AND ce.start_time <= $1
			AND ce.end_time >= $1
			AND ce.is_active_session = TRUE
		ORDER BY ce.start_time ASC
	`

	rows, err := r.db.QueryContext(ctx, query, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []domain.CalendarEvent
	for rows.Next() {
		var e domain.CalendarEvent
		err := rows.Scan(
			&e.ID,
			&e.Title,
			&e.Description,
			&e.EventType,
			&e.StartTime,
			&e.EndTime,
			&e.IsRecurring,
			&e.RecurrencePattern,
			&e.CourseID,
			&e.TopicID,
			&e.SessionID,
			&e.IsActiveSession,
			&e.CreatedBy,
			&e.CreatedAt,
			&e.UpdatedAt,
			&e.CourseName,
			&e.TopicTitle,
			&e.SessionTitle,
			&e.CreatorName,
			&e.WeekParity,
		)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}

	return events, rows.Err()
}

func (r *CalendarEventRepo) Update(ctx context.Context, event *domain.CalendarEvent) error {
	query := `
		UPDATE calendar_events SET
			title = $1, description = $2, event_type = $3, start_time = $4, end_time = $5,
			is_recurring = $6, recurrence_pattern = $7, course_id = $8, topic_id = $9, session_id = $10,
			is_active_session = $11, week_parity = $12, updated_at = NOW()
		WHERE id = $13
		RETURNING updated_at
	`

	return r.db.QueryRowContext(ctx, query,
		event.Title,
		event.Description,
		event.EventType,
		event.StartTime,
		event.EndTime,
		event.IsRecurring,
		event.RecurrencePattern,
		event.CourseID,
		event.TopicID,
		event.SessionID,
		event.IsActiveSession,
		event.WeekParity,
		event.ID,
	).Scan(&event.UpdatedAt)
}

func (r *CalendarEventRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM calendar_events WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *CalendarEventRepo) SetActiveSession(ctx context.Context, id string, isActive bool) error {
	query := `
		UPDATE calendar_events
		SET is_active_session = $1, updated_at = NOW()
		WHERE id = $2
	`
	result, err := r.db.ExecContext(ctx, query, isActive, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
