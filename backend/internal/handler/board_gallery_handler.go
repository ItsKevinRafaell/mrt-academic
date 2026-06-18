package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type BoardGalleryHandler struct {
	boardGalleryUsecase *usecase.BoardGalleryUsecase
}

func NewBoardGalleryHandler(uc *usecase.BoardGalleryUsecase) *BoardGalleryHandler {
	return &BoardGalleryHandler{
		boardGalleryUsecase: uc,
	}
}

type CreateBoardGalleryRequest struct {
	SessionID   int      `json:"session_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURL    string   `json:"image_url"`
	OCRText     string   `json:"ocr_text"`
	Tags        []string `json:"tags"`
	OrderNumber int      `json:"order_number"`
}

type UpdateBoardGalleryRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURL    string   `json:"image_url"`
	OCRText     string   `json:"ocr_text"`
	Tags        []string `json:"tags"`
	OrderNumber int      `json:"order_number"`
}

type ReorderBoardGalleryRequest struct {
	OrderNumber int `json:"order_number"`
}

// CreateItem handles POST /api/board-gallery
func (h *BoardGalleryHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	// Get user from context (assuming auth middleware is applied)
	userID := r.Context().Value("user_id")
	if userID == nil {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateBoardGalleryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	item := &domain.BoardGallery{
		SessionID:   req.SessionID,
		UploadedBy:  userID.(string),
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		OCRText:     req.OCRText,
		Tags:        req.Tags,
		OrderNumber: req.OrderNumber,
	}

	if err := h.boardGalleryUsecase.CreateItem(r.Context(), item); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, item)
}

// GetBySessionID handles GET /api/board-gallery/session/{session_id}
func (h *BoardGalleryHandler) GetBySessionID(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := r.PathValue("session_id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid session_id")
		return
	}

	items, err := h.boardGalleryUsecase.GetBySessionID(r.Context(), sessionID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, items)
}

// GetByID handles GET /api/board-gallery/{id}
func (h *BoardGalleryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid id")
		return
	}

	item, err := h.boardGalleryUsecase.GetByID(r.Context(), id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, item)
}

// UpdateItem handles PUT /api/board-gallery/{id}
func (h *BoardGalleryHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid id")
		return
	}

	var req UpdateBoardGalleryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	item := &domain.BoardGallery{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		OCRText:     req.OCRText,
		Tags:        req.Tags,
		OrderNumber: req.OrderNumber,
	}

	if err := h.boardGalleryUsecase.UpdateItem(r.Context(), item); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, item)
}

// DeleteItem handles DELETE /api/board-gallery/{id}
func (h *BoardGalleryHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid id")
		return
	}

	if err := h.boardGalleryUsecase.DeleteItem(r.Context(), id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Board gallery item deleted successfully"})
}

// ReorderItem handles PATCH /api/board-gallery/{id}/reorder
func (h *BoardGalleryHandler) ReorderItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid id")
		return
	}

	var req ReorderBoardGalleryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.boardGalleryUsecase.ReorderItems(r.Context(), id, req.OrderNumber); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Board gallery item reordered successfully"})
}

// Helper functions
func respondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	respondWithJSON(w, statusCode, map[string]string{"error": message})
}
