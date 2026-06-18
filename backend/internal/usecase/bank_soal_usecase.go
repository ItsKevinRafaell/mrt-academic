package usecase

import (
	"context"
	"fmt"
	"mrt-backend/internal/domain"
)

type BankSoalUsecase struct {
	examArchiveRepo domain.ExamArchiveRepository
	simulationRepo  domain.SimulationRepository
	questionRepo    domain.SimulationQuestionRepository
}

func NewBankSoalUsecase(
	examArchiveRepo domain.ExamArchiveRepository,
	simulationRepo domain.SimulationRepository,
	questionRepo domain.SimulationQuestionRepository,
) *BankSoalUsecase {
	return &BankSoalUsecase{
		examArchiveRepo: examArchiveRepo,
		simulationRepo:  simulationRepo,
		questionRepo:    questionRepo,
	}
}

// Exam Archive methods
func (uc *BankSoalUsecase) CreateExamArchive(ctx context.Context, req domain.CreateExamArchiveRequest) (*domain.ExamArchive, error) {
	if req.CourseID <= 0 {
		return nil, fmt.Errorf("course_id is required")
	}
	if req.Title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if req.ExamType == "" {
		return nil, fmt.Errorf("exam_type is required")
	}
	if req.Year < 2000 || req.Year > 2100 {
		return nil, fmt.Errorf("year must be between 2000 and 2100")
	}
	if req.FileURL == "" {
		return nil, fmt.Errorf("file_url is required")
	}

	archive := &domain.ExamArchive{
		CourseID:    req.CourseID,
		Title:       req.Title,
		Description: req.Description,
		ExamType:    req.ExamType,
		Year:        req.Year,
		FileURL:     req.FileURL,
		FileType:    req.FileType,
	}

	if archive.FileType == "" {
		archive.FileType = "pdf"
	}

	if err := uc.examArchiveRepo.Create(ctx, archive); err != nil {
		return nil, fmt.Errorf("failed to create exam archive: %w", err)
	}

	return archive, nil
}

func (uc *BankSoalUsecase) GetExamArchives(ctx context.Context, courseID int) ([]domain.ExamArchive, error) {
	return uc.examArchiveRepo.GetAll(ctx, courseID)
}

func (uc *BankSoalUsecase) GetExamArchiveByID(ctx context.Context, id int) (*domain.ExamArchive, error) {
	return uc.examArchiveRepo.GetByID(ctx, id)
}

func (uc *BankSoalUsecase) UpdateExamArchive(ctx context.Context, id int, req domain.UpdateExamArchiveRequest) (*domain.ExamArchive, error) {
	archive, err := uc.examArchiveRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("exam archive not found: %w", err)
	}

	if req.Title != "" {
		archive.Title = req.Title
	}
	if req.Description != "" {
		archive.Description = req.Description
	}
	if req.ExamType != "" {
		archive.ExamType = req.ExamType
	}
	if req.Year > 0 {
		archive.Year = req.Year
	}
	if req.FileURL != "" {
		archive.FileURL = req.FileURL
	}
	if req.FileType != "" {
		archive.FileType = req.FileType
	}

	if err := uc.examArchiveRepo.Update(ctx, archive); err != nil {
		return nil, fmt.Errorf("failed to update exam archive: %w", err)
	}

	return archive, nil
}

func (uc *BankSoalUsecase) DeleteExamArchive(ctx context.Context, id int) error {
	return uc.examArchiveRepo.Delete(ctx, id)
}

// Simulation methods
func (uc *BankSoalUsecase) CreateSimulation(ctx context.Context, req domain.CreateSimulationRequest) (*domain.Simulation, error) {
	if req.CourseID <= 0 {
		return nil, fmt.Errorf("course_id is required")
	}
	if req.Title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if req.DurationMinutes < 1 || req.DurationMinutes > 300 {
		return nil, fmt.Errorf("duration must be between 1 and 300 minutes")
	}

	simulation := &domain.Simulation{
		CourseID:        req.CourseID,
		Title:           req.Title,
		Description:     req.Description,
		DurationMinutes: req.DurationMinutes,
	}

	if err := uc.simulationRepo.Create(ctx, simulation); err != nil {
		return nil, fmt.Errorf("failed to create simulation: %w", err)
	}

	return simulation, nil
}

func (uc *BankSoalUsecase) GetSimulations(ctx context.Context, courseID int) ([]domain.Simulation, error) {
	return uc.simulationRepo.GetAll(ctx, courseID)
}

func (uc *BankSoalUsecase) GetSimulationByID(ctx context.Context, id int) (*domain.Simulation, error) {
	return uc.simulationRepo.GetByIDWithQuestions(ctx, id)
}

func (uc *BankSoalUsecase) UpdateSimulation(ctx context.Context, id int, req domain.UpdateSimulationRequest) (*domain.Simulation, error) {
	simulation, err := uc.simulationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("simulation not found: %w", err)
	}

	if req.Title != "" {
		simulation.Title = req.Title
	}
	if req.Description != "" {
		simulation.Description = req.Description
	}
	if req.DurationMinutes > 0 {
		simulation.DurationMinutes = req.DurationMinutes
	}

	if err := uc.simulationRepo.Update(ctx, simulation); err != nil {
		return nil, fmt.Errorf("failed to update simulation: %w", err)
	}

	return simulation, nil
}

func (uc *BankSoalUsecase) DeleteSimulation(ctx context.Context, id int) error {
	return uc.simulationRepo.Delete(ctx, id)
}

// Question methods
func (uc *BankSoalUsecase) CreateQuestion(ctx context.Context, question *domain.SimulationQuestion) error {
	if question.SimulationID <= 0 {
		return fmt.Errorf("simulation_id is required")
	}
	if question.QuestionText == "" {
		return fmt.Errorf("question_text is required")
	}
	if question.QuestionType == "" {
		return fmt.Errorf("question_type is required")
	}
	if question.Points <= 0 {
		question.Points = 1
	}

	return uc.questionRepo.Create(ctx, question)
}

func (uc *BankSoalUsecase) GetQuestionsBySimulation(ctx context.Context, simulationID int) ([]domain.SimulationQuestion, error) {
	return uc.questionRepo.GetBySimulationID(ctx, simulationID)
}

func (uc *BankSoalUsecase) UpdateQuestion(ctx context.Context, question *domain.SimulationQuestion) error {
	return uc.questionRepo.Update(ctx, question)
}

func (uc *BankSoalUsecase) DeleteQuestion(ctx context.Context, id int) error {
	return uc.questionRepo.Delete(ctx, id)
}
