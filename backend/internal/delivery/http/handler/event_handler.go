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

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_date", "Invalid date format (use YYYY-MM-DD)")
		return
	}

	event, err := h.eventUsecase.CreateEvent(req.Title, req.Description, req.EventType, eventDate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", "Failed to create event")
		return
	}

	respondJSON(w, http.StatusCreated, event)
}

func (h *EventHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	events, err := h.eventUsecase.GetAllEvents()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch events")
		return
	}

	respondJSON(w, http.StatusOK, events)
}

func (h *EventHandler) GetUpcoming(w http.ResponseWriter, r *http.Request) {
	events, err := h.eventUsecase.GetUpcomingEvents()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch events")
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

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_date", "Invalid date format (use YYYY-MM-DD)")
		return
	}

	err = h.eventUsecase.UpdateEvent(id, req.Title, req.Description, req.EventType, eventDate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", "Failed to update event")
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
		respondError(w, http.StatusInternalServerError, "delete_failed", "Failed to delete event")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Event deleted successfully"})
}
