package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
)

type simulationRepository struct {
	db *sql.DB
}

func NewSimulationRepository(db *sql.DB) domain.SimulationRepository {
	return &simulationRepository{db: db}
}

func (r *simulationRepository) Create(ctx context.Context, simulation *domain.Simulation) error {
	query := `
		INSERT INTO simulations (course_id, title, description, duration_minutes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		simulation.CourseID,
		simulation.Title,
		simulation.Description,
		simulation.DurationMinutes,
	).Scan(&simulation.ID, &simulation.CreatedAt, &simulation.UpdatedAt)
}

func (r *simulationRepository) GetAll(ctx context.Context, courseID int) ([]domain.Simulation, error) {
	query := `
		SELECT id, course_id, title, description, duration_minutes, created_at, updated_at
		FROM simulations
		WHERE course_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get simulations: %w", err)
	}
	defer rows.Close()

	var simulations []domain.Simulation
	for rows.Next() {
		var sim domain.Simulation
		err := rows.Scan(
			&sim.ID,
			&sim.CourseID,
			&sim.Title,
			&sim.Description,
			&sim.DurationMinutes,
			&sim.CreatedAt,
			&sim.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan simulation: %w", err)
		}
		simulations = append(simulations, sim)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating simulations: %w", err)
	}

	return simulations, nil
}

func (r *simulationRepository) GetByID(ctx context.Context, id int) (*domain.Simulation, error) {
	query := `
		SELECT id, course_id, title, description, duration_minutes, created_at, updated_at
		FROM simulations
		WHERE id = $1
	`
	var sim domain.Simulation
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&sim.ID,
		&sim.CourseID,
		&sim.Title,
		&sim.Description,
		&sim.DurationMinutes,
		&sim.CreatedAt,
		&sim.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("simulation not found")
		}
		return nil, fmt.Errorf("failed to get simulation: %w", err)
	}
	return &sim, nil
}

func (r *simulationRepository) GetByIDWithQuestions(ctx context.Context, id int) (*domain.Simulation, error) {
	sim, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	questionRepo := NewSimulationQuestionRepository(r.db)
	questions, err := questionRepo.GetBySimulationID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}
	sim.Questions = questions

	return sim, nil
}

func (r *simulationRepository) Update(ctx context.Context, simulation *domain.Simulation) error {
	query := `
		UPDATE simulations
		SET title = $1, description = $2, duration_minutes = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
		RETURNING updated_at
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		simulation.Title,
		simulation.Description,
		simulation.DurationMinutes,
		simulation.ID,
	).Scan(&simulation.UpdatedAt)
}

func (r *simulationRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM simulations WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete simulation: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("simulation not found")
	}
	return nil
}
