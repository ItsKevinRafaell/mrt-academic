package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type TaskHandler struct {
	taskUC *usecase.TaskUseCase
}

func NewTaskHandler(taskUC *usecase.TaskUseCase) *TaskHandler {
	return &TaskHandler{taskUC: taskUC}
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var task domain.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}
	task.CourseID = courseID

	if err := h.taskUC.CreateTask(&task); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusCreated, "Task created successfully", task)
}

func (h *TaskHandler) GetTasksByCourse(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	tasks, err := h.taskUC.GetTasksByCourse(courseID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Tasks retrieved", tasks)
}

func (h *TaskHandler) GetTaskByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	task, err := h.taskUC.GetTaskByID(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Task retrieved", task)
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	var task domain.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}
	task.ID = id

	if err := h.taskUC.UpdateTask(&task); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Task updated", task)
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	if err := h.taskUC.DeleteTask(id); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Task deleted", nil)
}

func (h *TaskHandler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		Error(w, http.StatusUnauthorized, "Unauthorized", "ERR_UNAUTHORIZED")
		return
	}

	var progress domain.TaskProgress
	if err := json.NewDecoder(r.Body).Decode(&progress); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}
	progress.TaskID = id
	progress.UserID = userID

	if err := h.taskUC.UpdateProgress(&progress); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Progress updated", progress)
}

func (h *TaskHandler) GetProgressByUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		Error(w, http.StatusUnauthorized, "Unauthorized", "ERR_UNAUTHORIZED")
		return
	}

	progress, err := h.taskUC.GetProgressByUser(userID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Progress retrieved", progress)
}

func (h *TaskHandler) GetProgressByTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	progress, err := h.taskUC.GetProgressByTask(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Progress retrieved", progress)
}

// Monitoring endpoints for admin
func (h *TaskHandler) GetTaskProgressSummary(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	summary, err := h.taskUC.GetTaskProgressSummary(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Summary retrieved", summary)
}

func (h *TaskHandler) GetCourseProgressSummary(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	summaries, err := h.taskUC.GetCourseProgressSummary(courseID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Summary retrieved", summaries)
}

// GetTaskDetail returns detailed task information with all students
func (h *TaskHandler) GetTaskDetail(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	detail, err := h.taskUC.GetTaskDetail(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Task detail retrieved", detail)
}
