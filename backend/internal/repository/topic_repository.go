package repository

import (
	"context"
	"mrt-backend/internal/domain"
)

type TopicRepository interface {
	Create(ctx context.Context, topic *domain.Topic) error
	GetByID(ctx context.Context, id int) (*domain.Topic, error)
	GetByCourseID(ctx context.Context, courseID int) ([]domain.Topic, error)
	Update(ctx context.Context, topic *domain.Topic) error
	Delete(ctx context.Context, id int) error
	UpdateOrder(ctx context.Context, topicID int, orderNumber int) error

	// Session-Topic relationships
	AssignSessionToTopic(ctx context.Context, sessionID int, topicID int) error
	RemoveSessionFromTopic(ctx context.Context, sessionID int) error
	GetSessionsByTopicID(ctx context.Context, topicID int) ([]domain.Session, error)

	// Material-Topic relationships
	GetMaterialsByTopicID(ctx context.Context, topicID int) ([]domain.Material, error)

	// Get topic with full details
	GetWithDetails(ctx context.Context, id int) (*domain.TopicWithDetails, error)

	// Get all topics for a course with their sessions (hierarchical view)
	GetTopicsWithSessions(ctx context.Context, courseID int) ([]domain.TopicWithSessions, error)
}
