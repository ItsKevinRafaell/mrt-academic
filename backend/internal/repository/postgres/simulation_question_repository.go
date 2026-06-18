package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
)

type simulationQuestionRepository struct {
	db *sql.DB
}

func NewSimulationQuestionRepository(db *sql.DB) domain.SimulationQuestionRepository {
	return &simulationQuestionRepository{db: db}
}

func (r *simulationQuestionRepository) Create(ctx context.Context, question *domain.SimulationQuestion) error {
	query := `
		INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	var optionsJSON []byte
	if question.Options != nil && *question.Options != "" {
		optionsJSON = []byte(*question.Options)
	}

	err := r.db.QueryRowContext(
		ctx,
		query,
		question.SimulationID,
		question.QuestionText,
		question.QuestionType,
		optionsJSON,
		question.CorrectAnswer,
		question.Points,
	).Scan(&question.ID, &question.CreatedAt, &question.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create simulation question: %w", err)
	}

	return nil
}

func (r *simulationQuestionRepository) GetBySimulationID(ctx context.Context, simulationID int) ([]domain.SimulationQuestion, error) {
	query := `
		SELECT id, simulation_id, question_text, question_type, options, correct_answer, points, created_at, updated_at
		FROM simulation_questions
		WHERE simulation_id = $1
		ORDER BY id
	`
	rows, err := r.db.QueryContext(ctx, query, simulationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get simulation questions: %w", err)
	}
	defer rows.Close()

	var questions []domain.SimulationQuestion
	for rows.Next() {
		var q domain.SimulationQuestion
		var optionsJSON []byte
		err := rows.Scan(
			&q.ID,
			&q.SimulationID,
			&q.QuestionText,
			&q.QuestionType,
			&optionsJSON,
			&q.CorrectAnswer,
			&q.Points,
			&q.CreatedAt,
			&q.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question: %w", err)
		}

		// Parse JSON options
		if len(optionsJSON) > 0 {
			optionsStr := string(optionsJSON)
			q.Options = &optionsStr
		}
		questions = append(questions, q)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating questions: %w", err)
	}

	return questions, nil
}

func (r *simulationQuestionRepository) GetByID(ctx context.Context, id int) (*domain.SimulationQuestion, error) {
	query := `
		SELECT id, simulation_id, question_text, question_type, options, correct_answer, points, created_at, updated_at
		FROM simulation_questions
		WHERE id = $1
	`
	var q domain.SimulationQuestion
	var optionsJSON []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&q.ID,
		&q.SimulationID,
		&q.QuestionText,
		&q.QuestionType,
		&optionsJSON,
		&q.CorrectAnswer,
		&q.Points,
		&q.CreatedAt,
		&q.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	// Parse JSON options
	if len(optionsJSON) > 0 {
		optionsStr := string(optionsJSON)
		q.Options = &optionsStr
	}
	return &q, nil
}

func (r *simulationQuestionRepository) Update(ctx context.Context, question *domain.SimulationQuestion) error {
	query := `
		UPDATE simulation_questions
		SET question_text = $1, question_type = $2, options = $3, correct_answer = $4, points = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING updated_at
	`
	var optionsJSON []byte
	if question.Options != nil && *question.Options != "" {
		optionsJSON = []byte(*question.Options)
	}

	err := r.db.QueryRowContext(
		ctx,
		query,
		question.QuestionText,
		question.QuestionType,
		optionsJSON,
		question.CorrectAnswer,
		question.Points,
		question.ID,
	).Scan(&question.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update question: %w", err)
	}
	return nil
}

func (r *simulationQuestionRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM simulation_questions WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("question not found")
	}
	return nil
}
