package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
)

type CalendarHandler struct {
	calendarUsecase *usecase.CalendarUsecase
}

func NewCalendarHandler(calendarUsecase *usecase.CalendarUsecase) *CalendarHandler {
	return &CalendarHandler{calendarUsecase: calendarUsecase}
}

// CreateEvent handles POST /api/calendar
func (h *CalendarHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title             string     `json:"title"`
		Description       string     `json:"description"`
		EventType         string     `json:"event_type"`
		StartTime         string     `json:"start_time"`
		EndTime           string     `json:"end_time"`
		IsRecurring       bool       `json:"is_recurring"`
		RecurrencePattern string     `json:"recurrence_pattern"`
		CourseID          *int       `json:"course_id"`
		TopicID           *int       `json:"topic_id"`
		SessionID         *int       `json:"session_id"`
		IsActiveSession   bool       `json:"is_active_session"`
		WeekParity        *string    `json:"week_parity"`
	}

	body, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(body))
	log.Printf("[calendar] raw body: %s", string(body))

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[calendar] decode error: %v", err)
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}
	log.Printf("[calendar] received: title=%q start=%q end=%q type=%q", req.Title, req.StartTime, req.EndTime, req.EventType)

	// Parse time flexibly: accept both RFC3339 and local datetime
	startTime, err := parseTimeFlexible(req.StartTime)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_start_time", "Invalid start_time format")
		return
	}
	endTime, err := parseTimeFlexible(req.EndTime)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_end_time", "Invalid end_time format")
		return
	}

	// Get user ID from context (set by auth middleware)
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User ID not found in context")
		return
	}

	// Reject stale JWTs (user_id no longer in DB) — forces re-login.
	// calendar_events.created_by is NOT NULL + FK → users(id).
	if exists, _ := h.calendarUsecase.UserExists(r.Context(), userID); !exists {
		respondError(w, http.StatusUnauthorized, "user_not_found", "Account no longer exists. Please log in again.")
		return
	}

	event := &domain.CalendarEvent{
		ID:                uuid.New().String(),
		Title:             req.Title,
		Description:       req.Description,
		EventType:         req.EventType,
		StartTime:         startTime,
		EndTime:           endTime,
		IsRecurring:       req.IsRecurring,
		RecurrencePattern: req.RecurrencePattern,
		CourseID:          req.CourseID,
		TopicID:           req.TopicID,
		SessionID:         req.SessionID,
		IsActiveSession:   req.IsActiveSession,
		WeekParity:        req.WeekParity,
		CreatedBy:         userID,
	}

	if err := h.calendarUsecase.CreateEvent(r.Context(), event); err != nil {
		if err == domain.ErrValidation {
			respondError(w, http.StatusBadRequest, "validation_error", "Invalid event data")
			return
		}
		log.Printf("[calendar] CreateEvent failed: %v", err)
		respondError(w, http.StatusInternalServerError, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, event)
}

// GetEvent handles GET /api/calendar/{id}
func (h *CalendarHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		respondError(w, http.StatusBadRequest, "invalid_id", "Event ID is required")
		return
	}

	event, err := h.calendarUsecase.GetEvent(r.Context(), id)
	if err != nil {
		if err == domain.ErrNotFound {
			respondError(w, http.StatusNotFound, "not_found", "Event not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch event")
		return
	}

	respondJSON(w, http.StatusOK, event)
}

// GetAllEvents handles GET /api/calendar
func (h *CalendarHandler) GetAllEvents(w http.ResponseWriter, r *http.Request) {
	filter := &domain.CalendarEventFilter{}

	// Parse query parameters
	if startDate := r.URL.Query().Get("start_date"); startDate != "" {
		t, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			filter.StartDate = &t
		}
	}

	if endDate := r.URL.Query().Get("end_date"); endDate != "" {
		t, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			filter.EndDate = &t
		}
	}

	if eventType := r.URL.Query().Get("event_type"); eventType != "" {
		filter.EventType = eventType
	}

	if courseID := r.URL.Query().Get("course_id"); courseID != "" {
		id, err := strconv.Atoi(courseID)
		if err == nil {
			filter.CourseID = id
		}
	}

	if isActive := r.URL.Query().Get("is_active"); isActive != "" {
		active := isActive == "true"
		filter.IsActive = &active
	}

	events, err := h.calendarUsecase.GetAllEvents(r.Context(), filter)
	if err != nil {
		// Log the actual error for debugging
		fmt.Printf("[CalendarHandler] GetAllEvents error: %v\n", err)
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch events")
		return
	}

	respondJSON(w, http.StatusOK, events)
}

// GetActiveSessions handles GET /api/calendar/active
func (h *CalendarHandler) GetActiveSessions(w http.ResponseWriter, r *http.Request) {
	events, err := h.calendarUsecase.GetActiveSessions(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch active sessions")
		return
	}

	respondJSON(w, http.StatusOK, events)
}

// GetUpcomingEvents handles GET /api/calendar/upcoming
func (h *CalendarHandler) GetUpcomingEvents(w http.ResponseWriter, r *http.Request) {
	days := 7 // Default to 7 days
	if daysParam := r.URL.Query().Get("days"); daysParam != "" {
		d, err := strconv.Atoi(daysParam)
		if err == nil && d > 0 {
			days = d
		}
	}

	events, err := h.calendarUsecase.GetUpcomingEvents(r.Context(), days)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch upcoming events")
		return
	}

	respondJSON(w, http.StatusOK, events)
}

// UpdateEvent handles PUT /api/calendar/{id}
func (h *CalendarHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		respondError(w, http.StatusBadRequest, "invalid_id", "Event ID is required")
		return
	}

	var req struct {
		Title             string     `json:"title"`
		Description       string     `json:"description"`
		EventType         string     `json:"event_type"`
		StartTime         string     `json:"start_time"`
		EndTime           string     `json:"end_time"`
		IsRecurring       bool       `json:"is_recurring"`
		RecurrencePattern string     `json:"recurrence_pattern"`
		CourseID          *int       `json:"course_id"`
		TopicID           *int       `json:"topic_id"`
		SessionID         *int       `json:"session_id"`
		IsActiveSession   bool       `json:"is_active_session"`
		WeekParity        *string    `json:"week_parity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	startTime, err := parseTimeFlexible(req.StartTime)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_start_time", "Invalid start_time format")
		return
	}
	endTime, err := parseTimeFlexible(req.EndTime)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_end_time", "Invalid end_time format")
		return
	}

	event := &domain.CalendarEvent{
		ID:                id,
		Title:             req.Title,
		Description:       req.Description,
		EventType:         req.EventType,
		StartTime:         startTime,
		EndTime:           endTime,
		IsRecurring:       req.IsRecurring,
		RecurrencePattern: req.RecurrencePattern,
		CourseID:          req.CourseID,
		TopicID:           req.TopicID,
		SessionID:         req.SessionID,
		IsActiveSession:   req.IsActiveSession,
		WeekParity:        req.WeekParity,
	}

	if err := h.calendarUsecase.UpdateEvent(r.Context(), event); err != nil {
		if err == domain.ErrValidation {
			respondError(w, http.StatusBadRequest, "validation_error", "Invalid event data")
			return
		}
		if err == domain.ErrNotFound {
			respondError(w, http.StatusNotFound, "not_found", "Event not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "update_failed", "Failed to update event")
		return
	}

	respondJSON(w, http.StatusOK, event)
}

// DeleteEvent handles DELETE /api/calendar/{id}
func (h *CalendarHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		respondError(w, http.StatusBadRequest, "invalid_id", "Event ID is required")
		return
	}

	if err := h.calendarUsecase.DeleteEvent(r.Context(), id); err != nil {
		if err == domain.ErrNotFound {
			respondError(w, http.StatusNotFound, "not_found", "Event not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "delete_failed", "Failed to delete event")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Event deleted successfully"})
}

// SetActiveSession handles PATCH /api/calendar/{id}/active
func (h *CalendarHandler) SetActiveSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		respondError(w, http.StatusBadRequest, "invalid_id", "Event ID is required")
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if err := h.calendarUsecase.SetActiveSession(r.Context(), id, req.IsActive); err != nil {
		if err == domain.ErrNotFound {
			respondError(w, http.StatusNotFound, "not_found", "Event not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "update_failed", "Failed to update active session status")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": fmt.Sprintf("Event %s active session status updated", id),
	})
}

// parseTimeFlexible parses time from multiple formats: RFC3339, "2006-01-02T15:04", "2006-01-02 15:04"
func parseTimeFlexible(s string) (time.Time, error) {
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
	}
	for _, f := range formats {
		t, err := time.Parse(f, s)
		if err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}
