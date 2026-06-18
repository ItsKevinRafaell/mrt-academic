package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/usecase"
)

type TopicHandler struct {
	topicUsecase *usecase.TopicUseCase
}

func NewTopicHandler(topicUsecase *usecase.TopicUseCase) *TopicHandler {
	return &TopicHandler{topicUsecase: topicUsecase}
}

// POST /api/v1/courses/{course_id}/topics
func (h *TopicHandler) CreateTopic(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		OrderNumber int    `json:"order_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	topic, err := h.topicUsecase.CreateTopic(r.Context(), courseID, req.Title, req.Description, req.OrderNumber)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusCreated, "Topic created successfully", topic)
}

// GET /api/v1/courses/{course_id}/topics
func (h *TopicHandler) GetTopicsByCourseID(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	topics, err := h.topicUsecase.GetTopicsByCourseID(r.Context(), courseID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topics retrieved successfully", topics)
}

// GET /api/v1/topics/{id}
func (h *TopicHandler) GetTopicByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	topic, err := h.topicUsecase.GetTopicByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topic retrieved successfully", topic)
}

// GET /api/v1/topics/{id}/details
func (h *TopicHandler) GetTopicWithDetails(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	topic, err := h.topicUsecase.GetTopicWithDetails(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topic details retrieved successfully", topic)
}

// GET /api/v1/courses/{course_id}/topics-with-sessions
func (h *TopicHandler) GetTopicsWithSessions(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	topics, err := h.topicUsecase.GetTopicsWithSessions(r.Context(), courseID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topics with sessions retrieved successfully", topics)
}

// PUT /api/v1/topics/{id}
func (h *TopicHandler) UpdateTopic(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		OrderNumber int    `json:"order_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	if err := h.topicUsecase.UpdateTopic(r.Context(), id, req.Title, req.Description, req.OrderNumber); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topic updated successfully", nil)
}

// DELETE /api/v1/topics/{id}
func (h *TopicHandler) DeleteTopic(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	if err := h.topicUsecase.DeleteTopic(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Topic deleted successfully", nil)
}

// POST /api/v1/topics/{id}/sessions
func (h *TopicHandler) AssignSessionToTopic(w http.ResponseWriter, r *http.Request) {
	topicIDStr := r.PathValue("id")
	topicID, err := strconv.Atoi(topicIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid topic ID", "ERR_VALIDATION")
		return
	}

	var req struct {
		SessionID int `json:"session_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	if err := h.topicUsecase.AssignSessionToTopic(r.Context(), req.SessionID, topicID); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Session assigned to topic successfully", nil)
}

// DELETE /api/v1/topics/{id}/sessions/{session_id}
func (h *TopicHandler) RemoveSessionFromTopic(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := r.PathValue("session_id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID", "ERR_VALIDATION")
		return
	}

	if err := h.topicUsecase.RemoveSessionFromTopic(r.Context(), sessionID); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Session removed from topic successfully", nil)
}

// PUT /api/v1/topics/reorder
func (h *TopicHandler) ReorderTopics(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Orders []struct {
			ID           int `json:"id"`
			OrderNumber int `json:"order_number"`
		} `json:"orders"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	for _, order := range req.Orders {
		if err := h.topicUsecase.UpdateTopicOrder(r.Context(), order.ID, order.OrderNumber); err != nil {
			handleError(w, err)
			return
		}
	}

	Success(w, http.StatusOK, "Topics reordered successfully", nil)
}
