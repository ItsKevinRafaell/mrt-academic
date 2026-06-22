package handler

import (
	"encoding/json"
	"net/http"

	"mrt-backend/internal/usecase"
)

type NotificationHandler struct {
	fonnte *usecase.FonnteService
}

func NewNotificationHandler(fonnte *usecase.FonnteService) *NotificationHandler {
	return &NotificationHandler{fonnte: fonnte}
}

type sendRequest struct {
	Phone   string `json:"phone"`
	Message string `json:"message"`
}

func (h *NotificationHandler) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req sendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	if err := h.fonnte.Send(req.Phone, req.Message); err != nil {
		Error(w, http.StatusInternalServerError, "Failed to send notification", "ERR_INTERNAL_SERVER")
		return
	}

	Success(w, http.StatusOK, "Notification sent", nil)
}

type reminderRequest struct {
	Phone    string `json:"phone"`
	TaskName string `json:"task_name"`
	Deadline string `json:"deadline"`
	Type     string `json:"type"` // "reminder" or "overdue"
}

func (h *NotificationHandler) SendTaskNotification(w http.ResponseWriter, r *http.Request) {
	var req reminderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	var err error
	switch req.Type {
	case "overdue":
		err = h.fonnte.SendTaskOverdue(req.Phone, req.TaskName)
	default:
		err = h.fonnte.SendTaskReminder(req.Phone, req.TaskName, req.Deadline)
	}

	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to send notification", "ERR_INTERNAL_SERVER")
		return
	}

	Success(w, http.StatusOK, "Task notification sent", nil)
}
