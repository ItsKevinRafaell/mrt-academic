package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository"
	"time"
)

type topicRepository struct {
	db *sql.DB
}

func NewTopicRepository(db *sql.DB) repository.TopicRepository {
	return &topicRepository{db: db}
}

func (r *topicRepository) Create(ctx context.Context, topic *domain.Topic) error {
	query := `
		INSERT INTO topics (course_id, title, description, order_number, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	now := time.Now()
	topic.CreatedAt = now
	topic.UpdatedAt = now

	return r.db.QueryRowContext(ctx, query,
		topic.CourseID,
		topic.Title,
		topic.Description,
		topic.OrderNumber,
		topic.CreatedAt,
		topic.UpdatedAt,
	).Scan(&topic.ID)
}

func (r *topicRepository) GetByID(ctx context.Context, id int) (*domain.Topic, error) {
	query := `
		SELECT id, course_id, title, description, order_number, created_at, updated_at
		FROM topics
		WHERE id = $1`

	topic := &domain.Topic{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&topic.ID,
		&topic.CourseID,
		&topic.Title,
		&topic.Description,
		&topic.OrderNumber,
		&topic.CreatedAt,
		&topic.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("topic not found")
	}
	if err != nil {
		return nil, err
	}

	return topic, nil
}

func (r *topicRepository) GetByCourseID(ctx context.Context, courseID int) ([]domain.Topic, error) {
	query := `
		SELECT id, course_id, title, description, order_number, created_at, updated_at
		FROM topics
		WHERE course_id = $1
		ORDER BY order_number ASC, id ASC`

	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []domain.Topic
	for rows.Next() {
		var topic domain.Topic
		err := rows.Scan(
			&topic.ID,
			&topic.CourseID,
			&topic.Title,
			&topic.Description,
			&topic.OrderNumber,
			&topic.CreatedAt,
			&topic.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		topics = append(topics, topic)
	}

	return topics, rows.Err()
}

func (r *topicRepository) Update(ctx context.Context, topic *domain.Topic) error {
	query := `
		UPDATE topics
		SET title = $1, description = $2, order_number = $3, updated_at = $4
		WHERE id = $5`

	now := time.Now()
	topic.UpdatedAt = now

	result, err := r.db.ExecContext(ctx, query,
		topic.Title,
		topic.Description,
		topic.OrderNumber,
		topic.UpdatedAt,
		topic.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("topic not found")
	}

	return nil
}

func (r *topicRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM topics WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("topic not found")
	}

	return nil
}

func (r *topicRepository) UpdateOrder(ctx context.Context, topicID int, orderNumber int) error {
	query := `
		UPDATE topics
		SET order_number = $1, updated_at = $2
		WHERE id = $3`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, orderNumber, now, topicID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("topic not found")
	}

	return nil
}

func (r *topicRepository) AssignSessionToTopic(ctx context.Context, sessionID int, topicID int) error {
	query := `
		UPDATE sessions
		SET topic_id = $1, updated_at = $2
		WHERE id = $3`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, topicID, now, sessionID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

func (r *topicRepository) RemoveSessionFromTopic(ctx context.Context, sessionID int) error {
	query := `
		UPDATE sessions
		SET topic_id = NULL, updated_at = $1
		WHERE id = $2`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, now, sessionID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

func (r *topicRepository) GetSessionsByTopicID(ctx context.Context, topicID int) ([]domain.Session, error) {
	query := `
		SELECT s.id, s.course_id, s.title, s.description, s.topic_id, s.created_at, s.updated_at
		FROM sessions s
		WHERE s.topic_id = $1
		ORDER BY s.title ASC`

	rows, err := r.db.QueryContext(ctx, query, topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []domain.Session
	for rows.Next() {
		var session domain.Session
		var topicID sql.NullInt64
		err := rows.Scan(
			&session.ID,
			&session.CourseID,
			&session.Title,
			&session.Description,
			&topicID,
			&session.CreatedAt,
			&session.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if topicID.Valid {
			tid := int(topicID.Int64)
			session.TopicID = &tid
		}
		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

func (r *topicRepository) GetMaterialsByTopicID(ctx context.Context, topicID int) ([]domain.Material, error) {
	query := `
		SELECT id, topic_id, title, description, type, url, created_at, updated_at
		FROM materials
		WHERE topic_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var materials []domain.Material
	for rows.Next() {
		var material domain.Material
		var topicID sql.NullInt64
		err := rows.Scan(
			&material.ID,
			&topicID,
			&material.Title,
			&material.Description,
			&material.Type,
			&material.URL,
			&material.CreatedAt,
			&material.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if topicID.Valid {
			tid := int(topicID.Int64)
			material.TopicID = &tid
		}
		materials = append(materials, material)
	}

	return materials, rows.Err()
}

func (r *topicRepository) GetWithDetails(ctx context.Context, id int) (*domain.TopicWithDetails, error) {
	query := `
		SELECT c.name
		FROM courses c
		JOIN topics t ON t.course_id = c.id
		WHERE t.id = $1
	`
	var courseName string
	err := r.db.QueryRowContext(ctx, query, id).Scan(&courseName)
	if err != nil {
		return nil, err
	}

	topic, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	sessions, err := r.GetSessionsByTopicID(ctx, id)
	if err != nil {
		return nil, err
	}

	materials, err := r.GetMaterialsByTopicID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &domain.TopicWithDetails{
		Topic:         *topic,
		CourseName:    courseName,
		Sessions:      sessions,
		Materials:     materials,
		Photos:        []domain.TopicPhoto{},
		SessionCount:  len(sessions),
		MaterialCount: len(materials),
	}, nil
}

func (r *topicRepository) GetTopicsWithSessions(ctx context.Context, courseID int) ([]domain.TopicWithSessions, error) {
	query := `
		SELECT
			t.id, t.course_id, t.title, t.description, t.order_number, t.created_at, t.updated_at,
			COALESCE(json_agg(
				json_build_object(
					'id', s.id,
					'course_id', s.course_id,
					'number', s.number,
					'title', s.title,
					'description', s.description,
					'topic_id', s.topic_id,
					'created_at', to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
					'updated_at', to_char(s.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
				) ORDER BY s.number ASC
			) FILTER (WHERE s.id IS NOT NULL), '[]'::json) as sessions
		FROM topics t
		LEFT JOIN sessions s ON s.topic_id = t.id
		WHERE t.course_id = $1
		GROUP BY t.id, t.course_id, t.title, t.description, t.order_number, t.created_at, t.updated_at
		ORDER BY t.order_number ASC, t.id ASC`

	log.Printf("Executing GetTopicsWithSessions for courseID: %d", courseID)
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		log.Printf("Query error: %v", err)
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var topics []domain.TopicWithSessions
	for rows.Next() {
		var topic domain.TopicWithSessions
		var sessionsJSON []byte
		err := rows.Scan(
			&topic.ID,
			&topic.CourseID,
			&topic.Title,
			&topic.Description,
			&topic.OrderNumber,
			&topic.CreatedAt,
			&topic.UpdatedAt,
			&sessionsJSON,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			return nil, fmt.Errorf("scan failed: %w", err)
		}

		if err := json.Unmarshal(sessionsJSON, &topic.Sessions); err != nil {
			log.Printf("JSON unmarshal error: %v, JSON: %s", err, string(sessionsJSON))
			return nil, fmt.Errorf("json unmarshal failed: %w", err)
		}

		topics = append(topics, topic)
	}

	return topics, rows.Err()
}
