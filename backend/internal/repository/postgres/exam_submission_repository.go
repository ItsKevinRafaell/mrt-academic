package postgres

import (
	"database/sql"
	"encoding/json"
	"mrt-backend/internal/domain"
)

type examSubmissionRepository struct {
	db *sql.DB
}

func NewExamSubmissionRepo(db *sql.DB) domain.ExamSubmissionRepository {
	return &examSubmissionRepository{db: db}
}

func (r *examSubmissionRepository) Create(submission *domain.ExamSubmission) error {
	answersJSON, err := json.Marshal(submission.Answers)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO exam_submissions (
			user_id, question_id, answers, score, time_spent_seconds
		) VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, question_id)
		DO UPDATE SET
			answers = EXCLUDED.answers,
			score = EXCLUDED.score,
			time_spent_seconds = EXCLUDED.time_spent_seconds,
			submitted_at = NOW()
		RETURNING id, submitted_at
	`

	return r.db.QueryRow(
		query,
		submission.UserID,
		submission.QuestionID,
		answersJSON,
		submission.Score,
		submission.TimeSpentSec,
	).Scan(&submission.ID, &submission.SubmittedAt)
}

func (r *examSubmissionRepository) GetByUserID(userID string) ([]*domain.ExamSubmission, error) {
	query := `
		SELECT id, user_id, question_id, answers, score, time_spent_seconds, submitted_at
		FROM exam_submissions WHERE user_id = $1
		ORDER BY submitted_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanSubmissions(rows)
}

func (r *examSubmissionRepository) GetByQuestionID(questionID int) ([]*domain.ExamSubmission, error) {
	query := `
		SELECT id, user_id, question_id, answers, score, time_spent_seconds, submitted_at
		FROM exam_submissions WHERE question_id = $1
		ORDER BY submitted_at DESC
	`

	rows, err := r.db.Query(query, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanSubmissions(rows)
}

func (r *examSubmissionRepository) scanSubmissions(rows *sql.Rows) ([]*domain.ExamSubmission, error) {
	submissions := make([]*domain.ExamSubmission, 0)

	for rows.Next() {
		submission := &domain.ExamSubmission{}
		var answersJSON []byte

		err := rows.Scan(
			&submission.ID,
			&submission.UserID,
			&submission.QuestionID,
			&answersJSON,
			&submission.Score,
			&submission.TimeSpentSec,
			&submission.SubmittedAt,
		)

		if err != nil {
			return nil, err
		}

		if len(answersJSON) > 0 {
			if err := json.Unmarshal(answersJSON, &submission.Answers); err != nil {
				return nil, err
			}
		}

		submissions = append(submissions, submission)
	}

	return submissions, rows.Err()
}
