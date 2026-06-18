package domain

import "time"

type Task struct {
	ID             int       `json:"id"`
	CourseID       int       `json:"course_id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Deadline       time.Time `json:"deadline"`
	SubmissionLink string    `json:"submission_link"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type TaskProgress struct {
	UserID      string     `json:"user_id"`
	TaskID      int        `json:"task_id"`
	Completed   bool       `json:"completed"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type TaskProgressWithUser struct {
	TaskProgress
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

type TaskMonitoringSummary struct {
	TaskID              int                    `json:"task_id"`
	TaskTitle           string                 `json:"task_title"`
	TotalUsers          int                    `json:"total_users"`
	CompletedCount      int                    `json:"completed_count"`
	CompletionRate      float64                `json:"completion_rate"`
	ProgressByUser      []TaskProgressWithUser `json:"progress_by_user"`
}

type TaskDetailResponse struct {
	Task                Task                     `json:"task"`
	TotalStudents       int                      `json:"total_students"`
	CompletedStudents   []TaskProgressWithUser   `json:"completed_students"`
	PendingStudents     []TaskProgressWithUser   `json:"pending_students"`
	CompletionRate      float64                  `json:"completion_rate"`
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
	GetProgressWithUsersByTaskID(taskID int) ([]TaskProgressWithUser, error)
	GetTotalUserCount() (int, error)
	GetTaskDetail(taskID int) (*TaskDetailResponse, error)
}
