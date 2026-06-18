package handler

import (
	"context"
	"encoding/json"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type BoardGalleryHandler struct {
	boardGalleryUsecase *usecase.BoardGalleryUsecase
}

func NewBoardGalleryHandler(boardGalleryUsecase *usecase.BoardGalleryUsecase) *BoardGalleryHandler {
	return &BoardGalleryHandler{boardGalleryUsecase: boardGalleryUsecase}
}

type BoardGalleryRequest struct {
	SessionID   int    `json:"session_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	OCRText     string `json:"ocr_text"`
}

func (h *BoardGalleryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req BoardGalleryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Validate required fields
	if req.SessionID == 0 {
		respondError(w, http.StatusBadRequest, "invalid_session_id", "session_id is required")
		return
	}
	if req.ImageURL == "" {
		respondError(w, http.StatusBadRequest, "invalid_image_url", "image_url is required")
		return
	}

	item := &domain.BoardGallery{
		SessionID:   req.SessionID,
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		OCRText:     req.OCRText,
	}

	if err := h.boardGalleryUsecase.CreateItem(context.Background(), item); err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, item)
}

func (h *BoardGalleryHandler) GetBySessionID(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := r.PathValue("session_id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_session_id", "Invalid session ID")
		return
	}

	items, err := h.boardGalleryUsecase.GetBySessionID(context.Background(), sessionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, items)
}

func (h *BoardGalleryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid ID")
		return
	}

	item, err := h.boardGalleryUsecase.GetByID(context.Background(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	if item == nil {
		respondError(w, http.StatusNotFound, "not_found", "Board gallery item not found")
		return
	}

	respondJSON(w, http.StatusOK, item)
}

func (h *BoardGalleryHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid ID")
		return
	}

	var req BoardGalleryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	item := &domain.BoardGallery{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		OCRText:     req.OCRText,
	}

	if err := h.boardGalleryUsecase.UpdateItem(context.Background(), item); err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, item)
}

func (h *BoardGalleryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid ID")
		return
	}

	if err := h.boardGalleryUsecase.DeleteItem(context.Background(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "delete_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Board gallery item deleted successfully"})
}

func (h *BoardGalleryHandler) ReorderItems(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "Invalid ID")
		return
	}

	var req struct {
		OrderNumber int `json:"order_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if err := h.boardGalleryUsecase.ReorderItems(context.Background(), id, req.OrderNumber); err != nil {
		respondError(w, http.StatusInternalServerError, "reorder_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Board gallery items reordered successfully"})
}
