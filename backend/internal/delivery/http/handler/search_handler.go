package handler

import (
	"mrt-backend/internal/usecase"
	"net/http"
)

type SearchHandler struct {
	searchUsecase *usecase.SearchUsecase
}

func NewSearchHandler(searchUsecase *usecase.SearchUsecase) *SearchHandler {
	return &SearchHandler{searchUsecase: searchUsecase}
}

func (h *SearchHandler) GetIndex(w http.ResponseWriter, r *http.Request) {
	index, err := h.searchUsecase.GetIndex()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", "Failed to fetch search index")
		return
	}

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
