package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"

	"github.com/lib/pq"
)

type SessionRepo struct {
	db *sql.DB
}

func NewSessionRepo(db *sql.DB) *SessionRepo {
	return &SessionRepo{db: db}
}

func (r *SessionRepo) Create(session *domain.Session) error {
	query := `INSERT INTO sessions (course_id, number, title, description)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	err := r.db.QueryRow(query, session.CourseID, session.Number, session.Title, session.Description).
		Scan(&session.ID, &session.CreatedAt, &session.UpdatedAt)

	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return domain.ErrAlreadyExists
	}
	return err
}

func (r *SessionRepo) GetByCourseID(courseID int) ([]domain.Session, error) {
	query := `SELECT id, course_id, number, title, description, created_at, updated_at
		FROM sessions WHERE course_id = $1 ORDER BY number`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []domain.Session
	for rows.Next() {
		var s domain.Session
		if err := rows.Scan(&s.ID, &s.CourseID, &s.Number, &s.Title,
			&s.Description, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (r *SessionRepo) GetByID(id int) (*domain.Session, error) {
	s := &domain.Session{}
	query := `SELECT id, course_id, number, title, description, created_at, updated_at
		FROM sessions WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&s.ID, &s.CourseID, &s.Number, &s.Title,
		&s.Description, &s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return s, err
}

func (r *SessionRepo) Update(session *domain.Session) error {
	query := `UPDATE sessions SET number = $1, title = $2, description = $3, updated_at = NOW()
		WHERE id = $4 RETURNING updated_at`

	err := r.db.QueryRow(query, session.Number, session.Title, session.Description, session.ID).
		Scan(&session.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	return err
}

func (r *SessionRepo) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM sessions WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
