package handler

import (
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
)

type NotificationHandler struct {
	repo *postgres.NotificationRepo
}

func NewNotificationHandler(repo *postgres.NotificationRepo) *NotificationHandler {
	return &NotificationHandler{repo: repo}
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	notifications, err := h.repo.GetByUser(userID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_NOTIFICATIONS", err.Error())
		return
	}

	if notifications == nil {
		notifications = []domain.Notification{}
	}
	writeJSON(w, http.StatusOK, "OK", notifications)
}

func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid notification ID")
		return
	}

	if err := h.repo.MarkRead(id); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_MARK_READ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Marked as read", nil)
}

func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	if err := h.repo.MarkAllRead(userID); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_MARK_ALL_READ", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "All marked as read", nil)
}

func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	count, err := h.repo.GetUnreadCount(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_COUNT", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "OK", count)
}
