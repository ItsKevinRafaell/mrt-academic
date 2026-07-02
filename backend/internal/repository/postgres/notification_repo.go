package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type NotificationRepo struct {
	db *sql.DB
}

func NewNotificationRepo(db *sql.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) Create(userID, title, message, notifType, link string) error {
	query := `INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, userID, title, message, notifType, link)
	return err
}

func (r *NotificationRepo) GetByUser(userID string, limit int) ([]domain.Notification, error) {
	query := `
		SELECT id, user_id, title, message, type, COALESCE(link, ''), is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []domain.Notification
	for rows.Next() {
		var n domain.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.Link, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, rows.Err()
}

func (r *NotificationRepo) MarkRead(id int) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *NotificationRepo) MarkAllRead(userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`
	_, err := r.db.Exec(query, userID)
	return err
}

func (r *NotificationRepo) GetUnreadCount(userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`
	err := r.db.QueryRow(query, userID).Scan(&count)
	return count, err
}
