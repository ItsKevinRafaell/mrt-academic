package usecase

import (
	"fmt"
	"mrt-backend/internal/domain"
)

type GradeComponentUsecase struct {
	gradeComponentRepo domain.GradeComponentRepository
}

func NewGradeComponentUsecase(repo domain.GradeComponentRepository) *GradeComponentUsecase {
	return &GradeComponentUsecase{gradeComponentRepo: repo}
}

func (u *GradeComponentUsecase) Create(courseID int, name string, weight float64, componentType string) (*domain.GradeComponent, error) {
	if name == "" {
		return nil, fmt.Errorf("component name is required")
	}
	if weight < 0 || weight > 100 {
		return nil, fmt.Errorf("weight must be between 0 and 100")
	}

	// Check if total weight exceeds 100%
	existingComponents, err := u.gradeComponentRepo.GetByCourseID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing components: %w", err)
	}

	totalWeight := weight
	for _, gc := range existingComponents {
		totalWeight += gc.Weight
	}

	if totalWeight > 100 {
		return nil, fmt.Errorf("total weight cannot exceed 100%%, current: %.2f%%", totalWeight)
	}

	gc := &domain.GradeComponent{
		CourseID: courseID,
		Name:     name,
		Weight:   weight,
		Type:     componentType,
	}

	if err := u.gradeComponentRepo.Create(gc); err != nil {
		return nil, fmt.Errorf("failed to create grade component: %w", err)
	}

	return gc, nil
}

func (u *GradeComponentUsecase) GetByCourseID(courseID int) ([]domain.GradeComponent, error) {
	components, err := u.gradeComponentRepo.GetByCourseID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get grade components: %w", err)
	}
	return components, nil
}

func (u *GradeComponentUsecase) Update(id int, name string, weight float64, componentType string) (*domain.GradeComponent, error) {
	if name == "" {
		return nil, fmt.Errorf("component name is required")
	}
	if weight < 0 || weight > 100 {
		return nil, fmt.Errorf("weight must be between 0 and 100")
	}

	gc, err := u.gradeComponentRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("grade component not found: %w", err)
	}

	// Check if total weight exceeds 100% with new weight
	existingComponents, err := u.gradeComponentRepo.GetByCourseID(gc.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing components: %w", err)
	}

	totalWeight := weight
	for _, existing := range existingComponents {
		if existing.ID != id {
			totalWeight += existing.Weight
		}
	}

	if totalWeight > 100 {
		return nil, fmt.Errorf("total weight cannot exceed 100%%, current: %.2f%%", totalWeight)
	}

	gc.Name = name
	gc.Weight = weight
	gc.Type = componentType

	if err := u.gradeComponentRepo.Update(gc); err != nil {
		return nil, fmt.Errorf("failed to update grade component: %w", err)
	}

	return gc, nil
}

func (u *GradeComponentUsecase) Delete(id int) error {
	if err := u.gradeComponentRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete grade component: %w", err)
	}
	return nil
}
