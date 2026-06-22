package usecase

import (
	"errors"
	"mrt-backend/internal/domain"
	"time"
)

type TaskUseCase struct {
	taskRepo domain.TaskRepository
}

func NewTaskUseCase(taskRepo domain.TaskRepository) *TaskUseCase {
	return &TaskUseCase{taskRepo: taskRepo}
}

func (uc *TaskUseCase) CreateTask(task *domain.Task) error {
	if task.Title == "" || task.CourseID == 0 || task.Deadline.IsZero() {
		return errors.New("title, course_id, and deadline are required")
	}
	return uc.taskRepo.Create(task)
}

func (uc *TaskUseCase) GetTasksByCourse(courseID int) ([]domain.Task, error) {
	tasks, _, err := uc.taskRepo.GetByCourseID(courseID, 1, 10000)
	return tasks, err
}

func (uc *TaskUseCase) GetTaskByID(id int) (*domain.Task, error) {
	return uc.taskRepo.GetByID(id)
}

func (uc *TaskUseCase) UpdateTask(task *domain.Task) error {
	if task.ID == 0 {
		return errors.New("task ID is required")
	}
	return uc.taskRepo.Update(task)
}

func (uc *TaskUseCase) DeleteTask(id int) error {
	return uc.taskRepo.Delete(id)
}

func (uc *TaskUseCase) UpdateProgress(progress *domain.TaskProgress) error {
	if progress.TaskID == 0 || progress.UserID == "" {
		return errors.New("task_id and user_id are required")
	}

	now := time.Now()
	if progress.Completed {
		progress.CompletedAt = &now
	} else {
		progress.CompletedAt = nil
	}

	return uc.taskRepo.UpdateProgress(progress)
}

func (uc *TaskUseCase) GetProgressByUser(userID string) ([]domain.TaskProgress, error) {
	return uc.taskRepo.GetProgressByUserID(userID)
}

func (uc *TaskUseCase) GetProgressByTask(taskID int) ([]domain.TaskProgress, error) {
	return uc.taskRepo.GetProgressByTaskID(taskID)
}

// Monitoring methods for admin
func (uc *TaskUseCase) GetTaskProgressSummary(taskID int) (*domain.TaskMonitoringSummary, error) {
	task, err := uc.taskRepo.GetByID(taskID)
	if err != nil {
		return nil, err
	}

	progressList, err := uc.taskRepo.GetProgressWithUsersByTaskID(taskID)
	if err != nil {
		return nil, err
	}

	totalUsers, err := uc.taskRepo.GetTotalUserCount()
	if err != nil {
		return nil, err
	}

	completedCount := 0
	for _, p := range progressList {
		if p.Completed {
			completedCount++
		}
	}

	completionRate := 0.0
	if totalUsers > 0 {
		completionRate = float64(completedCount) / float64(totalUsers) * 100.0
	}

	return &domain.TaskMonitoringSummary{
		TaskID:         taskID,
		TaskTitle:      task.Title,
		TotalUsers:     totalUsers,
		CompletedCount: completedCount,
		CompletionRate: completionRate,
		ProgressByUser: progressList,
	}, nil
}

func (uc *TaskUseCase) GetCourseProgressSummary(courseID int) ([]domain.TaskMonitoringSummary, error) {
	tasks, _, err := uc.taskRepo.GetByCourseID(courseID, 1, 10000)
	if err != nil {
		return nil, err
	}

	summaries := make([]domain.TaskMonitoringSummary, 0)
	for _, task := range tasks {
		summary, err := uc.GetTaskProgressSummary(task.ID)
		if err != nil {
			continue
		}
		summaries = append(summaries, *summary)
	}

	return summaries, nil
}

// GetTaskDetail returns detailed information about a task including all students
func (uc *TaskUseCase) GetTaskDetail(taskID int) (*domain.TaskDetailResponse, error) {
	return uc.taskRepo.GetTaskDetail(taskID)
}
