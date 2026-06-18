package postgres

import (
	"database/sql"
	"encoding/json"
	"mrt-backend/internal/domain"
)

type questionRepository struct {
	db *sql.DB
}

func NewQuestionRepo(db *sql.DB) domain.QuestionRepository {
	return &questionRepository{db: db}
}

func (r *questionRepository) Create(question *domain.Question) error {
	optionsJSON, err := json.Marshal(question.Options)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO questions (
			course_id, session_id, title, question_text, type,
			options, answer_key, difficulty_level, time_limit_minutes, external_url
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		question.CourseID,
		question.SessionID,
		question.Title,
		question.QuestionText,
		question.Type,
		optionsJSON,
		question.AnswerKey,
		question.DifficultyLevel,
		question.TimeLimitMin,
		question.ExternalURL,
	).Scan(&question.ID, &question.CreatedAt, &question.UpdatedAt)
}

func (r *questionRepository) GetByID(id int) (*domain.Question, error) {
	query := `
		SELECT id, course_id, session_id, title, question_text, type,
		       options, answer_key, difficulty_level, time_limit_minutes,
		       external_url, created_at, updated_at
		FROM questions WHERE id = $1
	`

	question := &domain.Question{}
	var optionsJSON []byte

	err := r.db.QueryRow(query, id).Scan(
		&question.ID,
		&question.CourseID,
		&question.SessionID,
		&question.Title,
		&question.QuestionText,
		&question.Type,
		&optionsJSON,
		&question.AnswerKey,
		&question.DifficultyLevel,
		&question.TimeLimitMin,
		&question.ExternalURL,
		&question.CreatedAt,
		&question.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	if len(optionsJSON) > 0 {
		if err := json.Unmarshal(optionsJSON, &question.Options); err != nil {
			return nil, err
		}
	}

	return question, nil
}

func (r *questionRepository) GetByCourseID(courseID int) ([]*domain.Question, error) {
	query := `
		SELECT id, course_id, session_id, title, question_text, type,
		       options, answer_key, difficulty_level, time_limit_minutes,
		       external_url, created_at, updated_at
		FROM questions WHERE course_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanQuestions(rows)
}

func (r *questionRepository) GetBySessionID(sessionID int) ([]*domain.Question, error) {
	query := `
		SELECT id, course_id, session_id, title, question_text, type,
		       options, answer_key, difficulty_level, time_limit_minutes,
		       external_url, created_at, updated_at
		FROM questions WHERE session_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanQuestions(rows)
}

func (r *questionRepository) Update(question *domain.Question) error {
	optionsJSON, err := json.Marshal(question.Options)
	if err != nil {
		return err
	}

	query := `
		UPDATE questions SET
			session_id = $2,
			title = $3,
			question_text = $4,
			type = $5,
			options = $6,
			answer_key = $7,
			difficulty_level = $8,
			time_limit_minutes = $9,
			external_url = $10,
			updated_at = NOW()
		WHERE id = $1
	`

	_, err = r.db.Exec(
		query,
		question.ID,
		question.SessionID,
		question.Title,
		question.QuestionText,
		question.Type,
		optionsJSON,
		question.AnswerKey,
		question.DifficultyLevel,
		question.TimeLimitMin,
		question.ExternalURL,
	)

	return err
}

func (r *questionRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM questions WHERE id = $1", id)
	return err
}

func (r *questionRepository) scanQuestions(rows *sql.Rows) ([]*domain.Question, error) {
	questions := make([]*domain.Question, 0)

	for rows.Next() {
		question := &domain.Question{}
		var optionsJSON []byte

		err := rows.Scan(
			&question.ID,
			&question.CourseID,
			&question.SessionID,
			&question.Title,
			&question.QuestionText,
			&question.Type,
			&optionsJSON,
			&question.AnswerKey,
			&question.DifficultyLevel,
			&question.TimeLimitMin,
			&question.ExternalURL,
			&question.CreatedAt,
			&question.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if len(optionsJSON) > 0 {
			if err := json.Unmarshal(optionsJSON, &question.Options); err != nil {
				return nil, err
			}
		}

		questions = append(questions, question)
	}

	return questions, rows.Err()
}
