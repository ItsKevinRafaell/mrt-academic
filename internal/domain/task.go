package domain

import "time"

type Task struct {
	ID          int       `json:"id"`
	CourseID    int       `json:"course_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Deadline    time.Time `json:"deadline"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TaskProgress struct {
	UserID      string     `json:"user_id"`
	TaskID      int        `json:"task_id"`
	Completed   bool       `json:"completed"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type TaskRepository interface {
	Create(task *Task) error
	GetByCourseID(courseID int) ([]Task, error)
	GetByID(id int) (*Task, error)
	Update(task *Task) error
	Delete(id int) error
	UpdateProgress(progress *TaskProgress) error
	GetProgressByUserID(userID string) ([]TaskProgress, error)
	GetProgressByTaskID(taskID int) ([]TaskProgress, error)
}
