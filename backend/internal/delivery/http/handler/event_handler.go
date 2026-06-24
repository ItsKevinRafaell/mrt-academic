package handler

import (
	"encoding/json"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
	"time"
)

type EventHandler struct {
	eventUsecase *usecase.EventUsecase
}

func NewEventHandler(eventUsecase *usecase.EventUsecase) *EventHandler {
	return &EventHandler{eventUsecase: eventUsecase}
}

type EventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventDate   string `json:"event_date"`
	EventType   string `json:"event_type"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	IsAllDay    *bool  `json:"is_all_day"`
	Color       string `json:"color"`
	Location    string `json:"location"`
	CourseID    *int   `json:"course_id"`
	SessionID   *int   `json:"session_id"`
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "ADMIN" && role != "SUPER_ADMIN" {
		respondError(w, http.StatusForbidden, "forbidden", "Admin role required")
		return
	}

	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Support both event_date (YYYY-MM-DD) and start_time/end_time (ISO 8601)
	var eventDate time.Time
	var err error
	if req.EventDate != "" {
		eventDate, err = time.Parse("2006-01-02", req.EventDate)
	} else if req.StartTime != "" {
		eventDate, err = time.Parse(time.RFC3339, req.StartTime)
	} else {
		respondError(w, http.StatusBadRequest, "missing_date", "event_date or start_time is required")
		return
	}
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_date", "Invalid date format")
		return
	}

	event, err := h.eventUsecase.CreateEvent(req.Title, req.Description, req.EventType, eventDate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, event)
}

func (h *EventHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	events, err := h.eventUsecase.GetAllEvents()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, events)
}

func (h *EventHandler) GetUpcoming(w http.ResponseWriter, r *http.Request) {
	events, err := h.eventUsecase.GetUpcomingEvents()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, events)
}

func (h *EventHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid event ID")
		return
	}

	event, err := h.eventUsecase.GetEvent(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "not_found", "Event not found")
		return
	}

	respondJSON(w, http.StatusOK, event)
}

func (h *EventHandler) Update(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "ADMIN" && role != "SUPER_ADMIN" {
		respondError(w, http.StatusForbidden, "forbidden", "Admin role required")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid event ID")
		return
	}

	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	var eventDate time.Time
	if req.EventDate != "" {
		eventDate, err = time.Parse("2006-01-02", req.EventDate)
	} else if req.StartTime != "" {
		eventDate, err = time.Parse(time.RFC3339, req.StartTime)
	} else {
		respondError(w, http.StatusBadRequest, "missing_date", "event_date or start_time is required")
		return
	}
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_date", "Invalid date format")
		return
	}

	err = h.eventUsecase.UpdateEvent(id, req.Title, req.Description, req.EventType, eventDate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Event updated successfully"})
}

func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "ADMIN" && role != "SUPER_ADMIN" {
		respondError(w, http.StatusForbidden, "forbidden", "Admin role required")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid event ID")
		return
	}

	err = h.eventUsecase.DeleteEvent(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "delete_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Event deleted successfully"})
}
