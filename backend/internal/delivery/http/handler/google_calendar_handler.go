package handler

import (
	"encoding/json"
	"log"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type GoogleCalendarHandler struct {
	gcalUsecase *usecase.GoogleCalendarUsecase
}

func NewGoogleCalendarHandler(gcalUsecase *usecase.GoogleCalendarUsecase) *GoogleCalendarHandler {
	return &GoogleCalendarHandler{gcalUsecase: gcalUsecase}
}

// POST /api/v1/calendar/sync
// Manually trigger Google Calendar sync
func (h *GoogleCalendarHandler) Sync(w http.ResponseWriter, r *http.Request) {
	synced, err := h.gcalUsecase.Sync(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "sync_failed", err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":   "Calendar sync completed",
		"synced":    synced,
	})
}

// GET /api/v1/calendar/events
// Get upcoming events from Google Calendar (read-only)
func (h *GoogleCalendarHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	days := 7
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}

	events, err := h.gcalUsecase.GetEvents(r.Context(), days)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}
	respondJSON(w, http.StatusOK, events)
}

// GET /api/v1/calendar/test
// Test Google Calendar connection
func (h *GoogleCalendarHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	err := h.gcalUsecase.TestConnection(r.Context())
	if err != nil {
		respondError(w, http.StatusBadGateway, "connection_failed", err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"message": "Google Calendar connection successful",
	})
}

// POST /api/v1/calendar/sync/webhook
// Accept webhook POST from Google Apps Script
func (h *GoogleCalendarHandler) WebhookSync(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Events []struct {
			Summary     string `json:"summary"`
			Description string `json:"description"`
			Location    string `json:"location"`
			StartTime   string `json:"start_time"`
			EndTime     string `json:"end_time"`
			Recurrence  []string `json:"recurrence"`
		} `json:"events"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid JSON body")
		return
	}

	synced, err := h.gcalUsecase.Sync(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "sync_failed", err.Error())
		return
	}

	log.Printf("[gcal webhook] synced %d events from webhook", synced)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Webhook sync completed",
		"synced":  synced,
	})
}
