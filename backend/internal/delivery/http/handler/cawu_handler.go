package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type CawuHandler struct {
	cawuUsecase *usecase.CawuUsecase
}

func NewCawuHandler(cawuUsecase *usecase.CawuUsecase) *CawuHandler {
	return &CawuHandler{cawuUsecase: cawuUsecase}
}

func (h *CawuHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	var cawu domain.Cawu
	if err := json.NewDecoder(r.Body).Decode(&cawu); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if err := h.cawuUsecase.CreateCawu(&cawu); err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", "Failed to create cawu")
		return
	}

	respondJSON(w, http.StatusCreated, cawu)
}

func (h *CawuHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	cawus, err := h.cawuUsecase.GetAllCawus()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch cawu")
		return
	}
	respondJSON(w, http.StatusOK, cawus)
}

func (h *CawuHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid cawu ID")
		return
	}

	cawu, err := h.cawuUsecase.GetCawuByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "not_found", "Cawu not found")
		return
	}
	respondJSON(w, http.StatusOK, cawu)
}

func (h *CawuHandler) GetActive(w http.ResponseWriter, r *http.Request) {
	cawu, err := h.cawuUsecase.GetActiveCawu()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch cawu")
		return
	}
	if cawu == nil {
		respondJSON(w, http.StatusOK, nil)
		return
	}
	respondJSON(w, http.StatusOK, cawu)
}

func (h *CawuHandler) SetActive(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid cawu ID")
		return
	}

	if err := h.cawuUsecase.SetActiveCawu(id); err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", "Failed to update cawu")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Active cawu updated"})
}

func (h *CawuHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid cawu ID")
		return
	}

	var cawu domain.Cawu
	if err := json.NewDecoder(r.Body).Decode(&cawu); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}
	cawu.ID = id

	if err := h.cawuUsecase.UpdateCawu(&cawu); err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", "Failed to update cawu")
		return
	}

	respondJSON(w, http.StatusOK, cawu)
}

func (h *CawuHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid cawu ID")
		return
	}

	if err := h.cawuUsecase.DeleteCawu(id); err != nil {
		respondError(w, http.StatusInternalServerError, "delete_failed", "Failed to delete cawu")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Cawu deleted"})
}

func (h *CawuHandler) FilterCourses(w http.ResponseWriter, r *http.Request) {
	cawuIDStr := r.PathValue("cawuID")
	cawuID, err := strconv.Atoi(cawuIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid cawu ID")
		return
	}

	// Verify cawu exists
	_, err = h.cawuUsecase.GetCawuByID(cawuID)
	if err != nil {
		respondError(w, http.StatusNotFound, "not_found", "Cawu not found")
		return
	}

	// Return success - actual filtering will be done by course usecase
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":  "Filter by cawu",
		"cawu_id":  cawuID,
		"filtered": true,
	})
}
