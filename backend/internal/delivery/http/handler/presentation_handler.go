package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type PresentationHandler struct {
	usecase *usecase.PresentationUsecase
}

func NewPresentationHandler(u *usecase.PresentationUsecase) *PresentationHandler {
	return &PresentationHandler{usecase: u}
}

func (h *PresentationHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	config, err := h.usecase.GetOrCreateConfig(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_CONFIG", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "OK", config)
}

func (h *PresentationHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	var req struct {
		Mode           string `json:"mode"`
		PriorityLimit  int    `json:"priority_limit"`
		StartNomorUrut int    `json:"start_nomor_urut"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_REQUEST", "Invalid request body")
		return
	}

	if req.Mode != "nomor_urut" && req.Mode != "prioritas" {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_MODE", "Mode must be 'nomor_urut' or 'prioritas'")
		return
	}

	config, err := h.usecase.GetOrCreateConfig(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_CONFIG", err.Error())
		return
	}
	config.Mode = domain.PresentationMode(req.Mode)
	config.PriorityLimit = req.PriorityLimit
	config.StartNomorUrut = req.StartNomorUrut

	if err := h.usecase.UpdateConfig(courseID, config.Mode, config.PriorityLimit, config.StartNomorUrut); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_UPDATE_CONFIG", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Config updated", config)
}

func (h *PresentationHandler) GetPriorityList(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	students, err := h.usecase.GetPriorityStudents(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_PRIORITY", err.Error())
		return
	}

	if students == nil {
		students = []domain.PriorityStudent{}
	}
	writeJSON(w, http.StatusOK, "OK", students)
}

func (h *PresentationHandler) AddPriority(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	userID := r.PathValue("userId")
	if userID == "" {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "User ID required")
		return
	}

	if err := h.usecase.AddToPriority(courseID, userID); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_ADD_PRIORITY", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Added to priority", nil)
}

func (h *PresentationHandler) RemovePriority(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	userID := r.PathValue("userId")
	if err := h.usecase.RemoveFromPriority(courseID, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_REMOVE_PRIORITY", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Removed from priority", nil)
}

func (h *PresentationHandler) ReorderPriority(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	var req struct {
		UserIDs []string `json:"user_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.usecase.ReorderPriority(courseID, req.UserIDs); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_REORDER", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Reordered", nil)
}

func (h *PresentationHandler) GetNext(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	presenter, err := h.usecase.GetNextPresenter(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_NEXT", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "OK", presenter)
}

func (h *PresentationHandler) RecordPresentation(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	var req struct {
		UserID string `json:"user_id"`
		Topic  string `json:"topic"`
		Points int    `json:"points"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_REQUEST", "Invalid request body")
		return
	}

	if req.Points <= 0 {
		req.Points = 1
	}

	if err := h.usecase.RecordPresentation(courseID, req.UserID, req.Topic, req.Points); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_RECORD", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Presentation recorded", nil)
}

func (h *PresentationHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	leaderboard, err := h.usecase.GetLeaderboard(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_LEADERBOARD", err.Error())
		return
	}

	if leaderboard == nil {
		leaderboard = []domain.LeaderboardEntry{}
	}
	writeJSON(w, http.StatusOK, "OK", leaderboard)
}

func (h *PresentationHandler) GetStudentHistory(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	userID := r.PathValue("userId")
	history, err := h.usecase.GetStudentRecord(courseID, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_HISTORY", err.Error())
		return
	}

	if history == nil {
		history = []domain.PresentationRecord{}
	}
	writeJSON(w, http.StatusOK, "OK", history)
}

func (h *PresentationHandler) GetAllStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.usecase.GetAllStudents()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_STUDENTS", err.Error())
		return
	}

	if students == nil {
		students = []domain.PriorityStudent{}
	}
	writeJSON(w, http.StatusOK, "OK", students)
}

func (h *PresentationHandler) GetPendingPresentations(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	pending, err := h.usecase.GetPendingPresentations(courseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_PENDING", err.Error())
		return
	}

	if pending == nil {
		pending = []domain.PendingPresentation{}
	}
	writeJSON(w, http.StatusOK, "OK", pending)
}

func (h *PresentationHandler) RequestPresentation(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid course ID")
		return
	}

	var req struct {
		UserID string `json:"user_id"`
		Topic  string `json:"topic"`
		Points int    `json:"points"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_REQUEST", "Invalid request body")
		return
	}

	if req.Points <= 0 {
		req.Points = 1
	}

	if err := h.usecase.CreatePendingPresentation(courseID, req.UserID, req.Topic, req.Points); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Presentation requested, waiting for approval", nil)
}

func (h *PresentationHandler) ApprovePresentation(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("pid"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid presentation ID")
		return
	}

	approverID := middleware.GetUserID(r.Context())
	if err := h.usecase.ApprovePresentation(id, approverID); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_APPROVE", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Presentation approved", nil)
}

func (h *PresentationHandler) RejectPresentation(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("pid"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid presentation ID")
		return
	}

	if err := h.usecase.RejectPresentation(id); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_REJECT", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Presentation rejected", nil)
}
