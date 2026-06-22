package handler

import (
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
	"net/http"
)

type DashboardHandler struct {
	dashboardUsecase *usecase.DashboardUsecase
}

func NewDashboardHandler(dashboardUsecase *usecase.DashboardUsecase) *DashboardHandler {
	return &DashboardHandler{dashboardUsecase: dashboardUsecase}
}

func (h *DashboardHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	summary, err := h.dashboardUsecase.GetSummary(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch dashboard summary")
		return
	}

	respondJSON(w, http.StatusOK, summary)
}
