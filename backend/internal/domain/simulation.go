package domain

import (
	"context"
	"time"
)

// Simulation represents a CBT simulation
type Simulation struct {
	ID              int                    `json:"id" db:"id"`
	CourseID        int                    `json:"course_id" db:"course_id"`
	Title           string                 `json:"title" db:"title"`
	Description     string                 `json:"description" db:"description"`
	DurationMinutes int                    `json:"duration_minutes" db:"duration_minutes"`
	CreatedAt       time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at" db:"updated_at"`
	Questions       []SimulationQuestion   `json:"questions,omitempty" db:"-"`
}

// SimulationQuestion represents a question in a simulation
type SimulationQuestion struct {
	ID            int       `json:"id" db:"id"`
	SimulationID  int       `json:"simulation_id" db:"simulation_id"`
	QuestionText  string    `json:"question_text" db:"question_text"`
	QuestionType  string    `json:"question_type" db:"question_type"` // 'multiple_choice', 'essay'
	Options       *string   `json:"options,omitempty" db:"options"` // JSON string
	CorrectAnswer *string   `json:"correct_answer,omitempty" db:"correct_answer"`
	Points        int       `json:"points" db:"points"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// CreateSimulationRequest represents the request to create a simulation
type CreateSimulationRequest struct {
	CourseID        int    `json:"course_id" validate:"required"`
	Title           string `json:"title" validate:"required"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"duration_minutes" validate:"required,min=1,max=300"`
}

// UpdateSimulationRequest represents the request to update a simulation
type UpdateSimulationRequest struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"duration_minutes" validate:"omitempty,min=1,max=300"`
}

// SimulationRepository defines the interface for simulation operations
type SimulationRepository interface {
	Create(ctx context.Context, simulation *Simulation) error
	GetAll(ctx context.Context, courseID int) ([]Simulation, error)
	GetByID(ctx context.Context, id int) (*Simulation, error)
	GetByIDWithQuestions(ctx context.Context, id int) (*Simulation, error)
	Update(ctx context.Context, simulation *Simulation) error
	Delete(ctx context.Context, id int) error
}

// SimulationQuestionRepository defines the interface for simulation question operations
type SimulationQuestionRepository interface {
	Create(ctx context.Context, question *SimulationQuestion) error
	GetBySimulationID(ctx context.Context, simulationID int) ([]SimulationQuestion, error)
	GetByID(ctx context.Context, id int) (*SimulationQuestion, error)
	Update(ctx context.Context, question *SimulationQuestion) error
	Delete(ctx context.Context, id int) error
}
