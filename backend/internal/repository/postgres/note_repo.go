package postgres

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type NoteRepo struct {
	db *sql.DB
}

func NewNoteRepo(db *sql.DB) *NoteRepo {
	return &NoteRepo{db: db}
}

func (r *NoteRepo) CreateNote(note *domain.Note) error {
	now := time.Now().Format(time.RFC3339)
	tagsJSON, _ := json.Marshal(note.Tags)
	_, err := r.db.Exec(
		`INSERT INTO notes (id, user_id, title, content, course_id, session_id, tags, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		note.ID, note.UserID, note.Title, note.Content,
		note.CourseID, note.SessionID, string(tagsJSON), now, now,
	)
	return err
}

func (r *NoteRepo) GetNoteByID(id string) (*domain.Note, error) {
	note := &domain.Note{}
	var tagsJSON sql.NullString
	var courseID, sessionID sql.NullInt64
	err := r.db.QueryRow(
		`SELECT id, user_id, title, content, course_id, session_id, tags, created_at, updated_at
		 FROM notes WHERE id = $1`, id,
	).Scan(&note.ID, &note.UserID, &note.Title, &note.Content,
		&courseID, &sessionID, &tagsJSON, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if courseID.Valid {
		v := int(courseID.Int64)
		note.CourseID = &v
	}
	if sessionID.Valid {
		v := int(sessionID.Int64)
		note.SessionID = &v
	}
	if tagsJSON.Valid {
		json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
	}
	return note, nil
}

func (r *NoteRepo) GetNotesByUser(userID string) ([]domain.Note, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, title, content, course_id, session_id, tags, created_at, updated_at
		 FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanNotes(rows)
}

func (r *NoteRepo) GetNotesBySession(userID string, sessionID int) ([]domain.Note, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, title, content, course_id, session_id, tags, created_at, updated_at
		 FROM notes WHERE user_id = $1 AND session_id = $2 ORDER BY updated_at DESC`,
		userID, sessionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanNotes(rows)
}

func (r *NoteRepo) GetNotesByCourse(userID string, courseID int) ([]domain.Note, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, title, content, course_id, session_id, tags, created_at, updated_at
		 FROM notes WHERE user_id = $1 AND course_id = $2 ORDER BY updated_at DESC`,
		userID, courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanNotes(rows)
}

func (r *NoteRepo) UpdateNote(note *domain.Note) error {
	tagsJSON, _ := json.Marshal(note.Tags)
	_, err := r.db.Exec(
		`UPDATE notes SET title = $1, content = $2, tags = $3, updated_at = $4 WHERE id = $5`,
		note.Title, note.Content, string(tagsJSON), time.Now().Format(time.RFC3339), note.ID,
	)
	return err
}

func (r *NoteRepo) DeleteNote(id, userID string) error {
	result, err := r.db.Exec(`DELETE FROM notes WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("note not found")
	}
	return nil
}

func scanNotes(rows *sql.Rows) ([]domain.Note, error) {
	var notes []domain.Note
	for rows.Next() {
		note := domain.Note{}
		var tagsJSON sql.NullString
		var courseID, sessionID sql.NullInt64
		if err := rows.Scan(&note.ID, &note.UserID, &note.Title, &note.Content,
			&courseID, &sessionID, &tagsJSON, &note.CreatedAt, &note.UpdatedAt); err != nil {
			return nil, err
		}
		if courseID.Valid {
			v := int(courseID.Int64)
			note.CourseID = &v
		}
		if sessionID.Valid {
			v := int(sessionID.Int64)
			note.SessionID = &v
		}
		if tagsJSON.Valid {
			json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		notes = append(notes, note)
	}
	return notes, rows.Err()
}
