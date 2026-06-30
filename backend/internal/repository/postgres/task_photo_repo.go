package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type TaskPhotoRepo struct {
	db *sql.DB
}

func NewTaskPhotoRepo(db *sql.DB) *TaskPhotoRepo {
	return &TaskPhotoRepo{db: db}
}

func (r *TaskPhotoRepo) Create(photo *domain.TaskPhoto) error {
	query := `
		INSERT INTO task_photos (task_id, image_url, caption, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at`

	return r.db.QueryRow(
		query,
		photo.TaskID,
		photo.ImageURL,
		photo.Caption,
		nullString(photo.CreatedBy),
	).Scan(&photo.ID, &photo.CreatedAt)
}

func (r *TaskPhotoRepo) GetByTaskID(taskID int) ([]domain.TaskPhoto, error) {
	query := `
		SELECT id, task_id, image_url, COALESCE(caption, ''), COALESCE(created_by::text, ''), created_at
		FROM task_photos
		WHERE task_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	photos := []domain.TaskPhoto{}
	for rows.Next() {
		var p domain.TaskPhoto
		var createdBy sql.NullString
		if err := rows.Scan(&p.ID, &p.TaskID, &p.ImageURL, &p.Caption, &createdBy, &p.CreatedAt); err != nil {
			return nil, err
		}
		if createdBy.Valid {
			p.CreatedBy = createdBy.String
		}
		photos = append(photos, p)
	}
	return photos, rows.Err()
}

func (r *TaskPhotoRepo) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM task_photos WHERE id = $1", id)
	return err
}

func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
