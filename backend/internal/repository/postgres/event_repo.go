package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
)

type EventRepo struct {
	db *sql.DB
}

func NewEventRepo(db *sql.DB) *EventRepo {
	return &EventRepo{db: db}
}

func (r *EventRepo) Create(e *domain.AcademicEvent) error {
	query := `
		INSERT INTO academic_events (title, description, event_date, event_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, e.Title, e.Description, e.EventDate, e.EventType).
		Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
}

func (r *EventRepo) GetAll() ([]domain.AcademicEvent, error) {
	query := `
		SELECT id, title, description, event_date, event_type, created_at, updated_at
		FROM academic_events
		ORDER BY event_date DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []domain.AcademicEvent
	for rows.Next() {
		var e domain.AcademicEvent
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EventType, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

func (r *EventRepo) GetUpcoming() ([]domain.AcademicEvent, error) {
	query := `
		SELECT id, title, description, event_date, event_type, created_at, updated_at
		FROM academic_events
		WHERE event_date >= CURRENT_DATE
		ORDER BY event_date ASC
		LIMIT 10
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []domain.AcademicEvent
	for rows.Next() {
		var e domain.AcademicEvent
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EventType, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

func (r *EventRepo) GetByID(id int) (*domain.AcademicEvent, error) {
	e := &domain.AcademicEvent{}
	query := `
		SELECT id, title, description, event_date, event_type, created_at, updated_at
		FROM academic_events
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EventType, &e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return e, err
}

func (r *EventRepo) Update(e *domain.AcademicEvent) error {
	query := `
		UPDATE academic_events
		SET title = $1, description = $2, event_date = $3, event_type = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING updated_at
	`
	return r.db.QueryRow(query, e.Title, e.Description, e.EventDate, e.EventType, e.ID).
		Scan(&e.UpdatedAt)
}

func (r *EventRepo) Delete(id int) error {
	query := `DELETE FROM academic_events WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
