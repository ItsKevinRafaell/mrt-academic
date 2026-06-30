package domain

import "time"

type TaskPhoto struct {
	ID        int       `json:"id"`
	TaskID    int       `json:"task_id"`
	ImageURL  string    `json:"image_url"`
	Caption   string    `json:"caption,omitempty"`
	CreatedBy string    `json:"created_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type TaskPhotoRepository interface {
	Create(photo *TaskPhoto) error
	GetByTaskID(taskID int) ([]TaskPhoto, error)
	Delete(id int) error
}
