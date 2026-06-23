package handler

import (
	"encoding/json"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
	"time"
)

type CourseHandler struct {
	courseUsecase *usecase.CourseUsecase
}

func NewCourseHandler(courseUsecase *usecase.CourseUsecase) *CourseHandler {
	return &CourseHandler{courseUsecase: courseUsecase}
}

type CourseRequest struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	SKS         int      `json:"sks"`
	Description string   `json:"description"`
	CourseType  string   `json:"course_type"`
	Instructors []string `json:"instructors"`
}

func (h *CourseHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	courses, pagination, err := h.courseUsecase.GetAll(r.Context(), page, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	SuccessWithMeta(w, http.StatusOK, "Courses retrieved", courses, pagination)
}

func (h *CourseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathParam(r, "id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	course, err := h.courseUsecase.GetByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Course retrieved", course)
}

func (h *CourseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	courseType := req.CourseType
	if courseType == "" {
		courseType = "lecturer"
	}

	course := &domain.Course{
		Code:        req.Code,
		Name:        req.Name,
		SKS:         req.SKS,
		Description: req.Description,
		CourseType:  courseType,
		Instructors: req.Instructors,
	}

	if err := h.courseUsecase.Create(r.Context(), course); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusCreated, "Course created", course)
}

func (h *CourseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathParam(r, "id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	var req CourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	courseType := req.CourseType
	if courseType == "" {
		courseType = "lecturer"
	}

	course := &domain.Course{
		ID:          id,
		Code:        req.Code,
		Name:        req.Name,
		SKS:         req.SKS,
		Description: req.Description,
		CourseType:  courseType,
		Instructors: req.Instructors,
	}

	if err := h.courseUsecase.Update(r.Context(), course); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Course updated", course)
}

func (h *CourseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathParam(r, "id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	if err := h.courseUsecase.Delete(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Course deleted", nil)
}

type SessionRequest struct {
	Number      int    `json:"number"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (h *CourseHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "course_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	sessions, pagination, err := h.courseUsecase.GetSessions(r.Context(), courseID, page, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	SuccessWithMeta(w, http.StatusOK, "Sessions retrieved", sessions, pagination)
}

func (h *CourseHandler) GetSessionByID(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parsePathParam(r, "session_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID", "ERR_VALIDATION")
		return
	}

	session, err := h.courseUsecase.GetSessionByID(r.Context(), sessionID)
	if err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Session retrieved", session)
}

func (h *CourseHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "course_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	var req SessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	session := &domain.Session{
		CourseID:    courseID,
		Number:      req.Number,
		Title:       req.Title,
		Description: req.Description,
	}

	if err := h.courseUsecase.CreateSession(r.Context(), session); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusCreated, "Session created", session)
}

func (h *CourseHandler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parsePathParam(r, "session_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID", "ERR_VALIDATION")
		return
	}

	var req SessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	session := &domain.Session{
		ID:          sessionID,
		Number:      req.Number,
		Title:       req.Title,
		Description: req.Description,
	}

	if err := h.courseUsecase.UpdateSession(r.Context(), session); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Session updated", session)
}

func (h *CourseHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parsePathParam(r, "session_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID", "ERR_VALIDATION")
		return
	}

	if err := h.courseUsecase.DeleteSession(r.Context(), sessionID); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Session deleted", nil)
}

type MaterialRequest struct {
	SessionID   int    `json:"session_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	URL         string `json:"url"`
}

func (h *CourseHandler) GetMaterialsByCourse(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "course_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	materials, err := h.courseUsecase.GetMaterialsByCourse(r.Context(), courseID)
	if err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Materials retrieved", materials)
}

func (h *CourseHandler) GetMaterialsBySession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parsePathParam(r, "session_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID", "ERR_VALIDATION")
		return
	}

	materials, err := h.courseUsecase.GetMaterialsBySession(r.Context(), sessionID)
	if err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Materials retrieved", materials)
}

func (h *CourseHandler) CreateMaterial(w http.ResponseWriter, r *http.Request) {
	var req MaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	material := &domain.Material{
		SessionID:   &req.SessionID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		URL:         req.URL,
	}

	if err := h.courseUsecase.CreateMaterial(r.Context(), material); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusCreated, "Material created", material)
}

func (h *CourseHandler) UpdateMaterial(w http.ResponseWriter, r *http.Request) {
	materialID, err := parsePathParam(r, "material_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid material ID", "ERR_VALIDATION")
		return
	}

	var req MaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	material := &domain.Material{
		ID:          materialID,
		SessionID:   &req.SessionID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		URL:         req.URL,
	}

	if err := h.courseUsecase.UpdateMaterial(r.Context(), material); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Material updated", material)
}

func (h *CourseHandler) DeleteMaterial(w http.ResponseWriter, r *http.Request) {
	materialID, err := parsePathParam(r, "material_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid material ID", "ERR_VALIDATION")
		return
	}

	if err := h.courseUsecase.DeleteMaterial(r.Context(), materialID); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Material deleted", nil)
}

func (h *CourseHandler) GetMaterialsByTopic(w http.ResponseWriter, r *http.Request) {
	topicID, err := parsePathParam(r, "topic_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	materials, err := h.courseUsecase.GetMaterialsByTopic(r.Context(), topicID)
	if err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Materials retrieved", materials)
}

func (h *CourseHandler) CreateMaterialForTopic(w http.ResponseWriter, r *http.Request) {
	topicID, err := parsePathParam(r, "topic_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	var req MaterialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	material := &domain.Material{
		TopicID:     &topicID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		URL:         req.URL,
	}

	if err := h.courseUsecase.CreateMaterialForTopic(r.Context(), material); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusCreated, "Material created", material)
}

type TaskRequest struct {
	CourseID    int    `json:"course_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Deadline    string `json:"deadline"`
}

type TaskProgressRequest struct {
	Completed bool `json:"completed"`
}

func (h *CourseHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "course_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	tasks, pagination, err := h.courseUsecase.GetTasks(r.Context(), courseID, page, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	SuccessWithMeta(w, http.StatusOK, "Tasks retrieved", tasks, pagination)
}

func (h *CourseHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "course_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	var req TaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	deadline, err := time.Parse(time.RFC3339, req.Deadline)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid deadline format", "ERR_VALIDATION")
		return
	}

	task := &domain.Task{
		CourseID:    courseID,
		Title:       req.Title,
		Description: req.Description,
		Deadline:    deadline,
	}

	if err := h.courseUsecase.CreateTask(r.Context(), task); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusCreated, "Task created", task)
}

func (h *CourseHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := parsePathParam(r, "task_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	var req TaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	deadline, err := time.Parse(time.RFC3339, req.Deadline)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid deadline format", "ERR_VALIDATION")
		return
	}

	task := &domain.Task{
		ID:          taskID,
		CourseID:    req.CourseID,
		Title:       req.Title,
		Description: req.Description,
		Deadline:    deadline,
	}

	if err := h.courseUsecase.UpdateTask(r.Context(), task); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Task updated", task)
}

func (h *CourseHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := parsePathParam(r, "task_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	if err := h.courseUsecase.DeleteTask(r.Context(), taskID); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Task deleted", nil)
}

func (h *CourseHandler) UpdateTaskProgress(w http.ResponseWriter, r *http.Request) {
	taskID, err := parsePathParam(r, "task_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid task ID", "ERR_VALIDATION")
		return
	}

	var req TaskProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	userID := middleware.GetUserID(r.Context())
	progress := &domain.TaskProgress{
		TaskID:    taskID,
		UserID:    userID,
		Completed: req.Completed,
	}

	if err := h.courseUsecase.UpdateTaskProgress(r.Context(), progress); err != nil {
		handleError(w, err)
		return
	}
	Success(w, http.StatusOK, "Task progress updated", progress)
}

func parsePathParam(r *http.Request, param string) (int, error) {
	val := r.PathValue(param)
	if val == "" {
		return 0, domain.ErrValidation
	}
	return strconv.Atoi(val)
}
