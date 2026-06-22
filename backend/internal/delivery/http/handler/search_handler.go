package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"mrt-backend/internal/domain"
	"net/http"
)

type SearchUsecaseInterface interface {
	GetIndex() (*domain.SearchIndex, error)
	Search(query string) (*domain.SearchIndex, error)
	InvalidateCache() error
}

type SearchHandler struct {
	searchUsecase SearchUsecaseInterface
}

func NewSearchHandler(searchUsecase SearchUsecaseInterface) *SearchHandler {
	return &SearchHandler{searchUsecase: searchUsecase}
}

func computeETag(data interface{}) string {
	jsonBytes, _ := json.Marshal(data)
	hash := sha256.Sum256(jsonBytes)
	return `"` + hex.EncodeToString(hash[:8]) + `"`
}

func (h *SearchHandler) GetIndex(w http.ResponseWriter, r *http.Request) {
	index, err := h.searchUsecase.GetIndex()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch search index")
		return
	}

	etag := computeETag(index)
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("ETag", etag)
	respondJSON(w, http.StatusOK, index)
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondError(w, http.StatusBadRequest, "missing_query", "Query parameter 'q' is required")
		return
	}

	results, err := h.searchUsecase.Search(query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "search_failed", "Search operation failed")
		return
	}

	respondJSON(w, http.StatusOK, results)
}
