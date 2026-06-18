package handler

import (
	"encoding/json"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type ScheduleHandler struct {
	scheduleUsecase *usecase.ScheduleUsecase
}

func NewScheduleHandler(scheduleUsecase *usecase.ScheduleUsecase) *ScheduleHandler {
	return &ScheduleHandler{scheduleUsecase: scheduleUsecase}
}

type ScheduleRequest struct {
	CourseID  int    `json:"course_id"`
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	SessionID *int   `json:"session_id,omitempty"`
}

func (h *ScheduleHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	schedules, err := h.scheduleUsecase.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, schedules)
}

func (h *ScheduleHandler) GetByCourseID(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_course_id", "Invalid course ID")
		return
	}

	schedules, err := h.scheduleUsecase.GetByCourseID(courseID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, schedules)
}

func (h *ScheduleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid schedule ID")
		return
	}

	schedule, err := h.scheduleUsecase.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "not_found", "Schedule not found")
		return
	}

	respondJSON(w, http.StatusOK, schedule)
}

func (h *ScheduleHandler) GetActive(w http.ResponseWriter, r *http.Request) {
	schedules, err := h.scheduleUsecase.GetActive()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, schedules)
}

func (h *ScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req ScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	schedule, err := h.scheduleUsecase.Create(req.CourseID, req.DayOfWeek, req.StartTime, req.EndTime, req.SessionID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, schedule)
}

func (h *ScheduleHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid schedule ID")
		return
	}

	var req ScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	err = h.scheduleUsecase.Update(id, req.CourseID, req.DayOfWeek, req.StartTime, req.EndTime, req.SessionID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "update_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Schedule updated successfully"})
}

func (h *ScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid schedule ID")
		return
	}

	err = h.scheduleUsecase.Delete(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "delete_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Schedule deleted successfully"})
}
