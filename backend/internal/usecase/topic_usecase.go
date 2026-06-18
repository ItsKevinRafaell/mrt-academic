package usecase

import (
	"context"
	"fmt"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository"
)

type TopicUseCase struct {
	topicRepo    repository.TopicRepository
	sessionRepo  domain.SessionRepository
	materialRepo domain.MaterialRepository
}

func NewTopicUseCase(
	topicRepo repository.TopicRepository,
	sessionRepo domain.SessionRepository,
	materialRepo domain.MaterialRepository,
) *TopicUseCase {
	return &TopicUseCase{
		topicRepo:    topicRepo,
		sessionRepo:  sessionRepo,
		materialRepo: materialRepo,
	}
}

// CreateTopic creates a new topic for a course
func (uc *TopicUseCase) CreateTopic(ctx context.Context, courseID int, title, description string, orderNumber int) (*domain.Topic, error) {
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}

	topic := &domain.Topic{
		CourseID:    courseID,
		Title:       title,
		Description: description,
		OrderNumber: orderNumber,
	}

	if err := uc.topicRepo.Create(ctx, topic); err != nil {
		return nil, fmt.Errorf("failed to create topic: %w", err)
	}

	return topic, nil
}

// GetTopicByID retrieves a topic by ID
func (uc *TopicUseCase) GetTopicByID(ctx context.Context, id int) (*domain.Topic, error) {
	topic, err := uc.topicRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}
	return topic, nil
}

// GetTopicsByCourseID retrieves all topics for a course
func (uc *TopicUseCase) GetTopicsByCourseID(ctx context.Context, courseID int) ([]domain.Topic, error) {
	topics, err := uc.topicRepo.GetByCourseID(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get topics: %w", err)
	}
	return topics, nil
}

// GetTopicWithDetails retrieves a topic with all its sessions and materials
func (uc *TopicUseCase) GetTopicWithDetails(ctx context.Context, id int) (*domain.TopicWithDetails, error) {
	topicDetails, err := uc.topicRepo.GetWithDetails(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get topic with details: %w", err)
	}
	return topicDetails, nil
}

// UpdateTopic updates a topic
func (uc *TopicUseCase) UpdateTopic(ctx context.Context, id int, title, description string, orderNumber int) error {
	if title == "" {
		return fmt.Errorf("title is required")
	}

	topic, err := uc.topicRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get topic: %w", err)
	}

	topic.Title = title
	topic.Description = description
	topic.OrderNumber = orderNumber

	if err := uc.topicRepo.Update(ctx, topic); err != nil {
		return fmt.Errorf("failed to update topic: %w", err)
	}

	return nil
}

// DeleteTopic deletes a topic
func (uc *TopicUseCase) DeleteTopic(ctx context.Context, id int) error {
	if err := uc.topicRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete topic: %w", err)
	}
	return nil
}

// AssignSessionToTopic assigns a session to a topic
func (uc *TopicUseCase) AssignSessionToTopic(ctx context.Context, sessionID int, topicID int) error {
	// Verify session exists
	_, err := uc.sessionRepo.GetByID(sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	// Verify topic exists
	_, err = uc.topicRepo.GetByID(ctx, topicID)
	if err != nil {
		return fmt.Errorf("failed to get topic: %w", err)
	}

	if err := uc.topicRepo.AssignSessionToTopic(ctx, sessionID, topicID); err != nil {
		return fmt.Errorf("failed to assign session to topic: %w", err)
	}

	return nil
}

// RemoveSessionFromTopic removes a session from its topic
func (uc *TopicUseCase) RemoveSessionFromTopic(ctx context.Context, sessionID int) error {
	if err := uc.topicRepo.RemoveSessionFromTopic(ctx, sessionID); err != nil {
		return fmt.Errorf("failed to remove session from topic: %w", err)
	}
	return nil
}

// UpdateTopicOrder updates the order number of a topic
func (uc *TopicUseCase) UpdateTopicOrder(ctx context.Context, topicID int, orderNumber int) error {
	if err := uc.topicRepo.UpdateOrder(ctx, topicID, orderNumber); err != nil {
		return fmt.Errorf("failed to update topic order: %w", err)
	}
	return nil
}

// ReorderTopics reorders multiple topics at once
func (uc *TopicUseCase) ReorderTopics(ctx context.Context, topicOrders map[int]int) error {
	for topicID, orderNumber := range topicOrders {
		if err := uc.topicRepo.UpdateOrder(ctx, topicID, orderNumber); err != nil {
			return fmt.Errorf("failed to update topic %d order: %w", topicID, err)
		}
	}
	return nil
}

// GetTopicsWithSessions retrieves all topics for a course with their sessions (hierarchical view)
func (uc *TopicUseCase) GetTopicsWithSessions(ctx context.Context, courseID int) ([]domain.TopicWithSessions, error) {
	topics, err := uc.topicRepo.GetTopicsWithSessions(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get topics with sessions: %w", err)
	}
	return topics, nil
}
