package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"mrt-backend/internal/usecase"
)

type GradeComponentHandler struct {
	usecase *usecase.GradeComponentUsecase
}

func NewGradeComponentHandler(uc *usecase.GradeComponentUsecase) *GradeComponentHandler {
	return &GradeComponentHandler{usecase: uc}
}

type CreateGradeComponentRequest struct {
	Name   string  `json:"name"`
	Weight float64 `json:"weight"`
	Type   string  `json:"type"`
}

type UpdateGradeComponentRequest struct {
	Name   string  `json:"name"`
	Weight float64 `json:"weight"`
	Type   string  `json:"type"`
}

// CreateGradeComponent creates a new grade component for a course
func (h *GradeComponentHandler) CreateGradeComponent(w http.ResponseWriter, r *http.Request) {
	courseIDStr := strings.TrimPrefix(r.URL.Path, "/api/v1/courses/")
	courseIDStr = strings.TrimSuffix(courseIDStr, "/grade-components")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	var req CreateGradeComponentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	gc, err := h.usecase.Create(courseID, req.Name, req.Weight, req.Type)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(gc)
}

// GetGradeComponentsByCourseID retrieves all grade components for a course
func (h *GradeComponentHandler) GetGradeComponentsByCourseID(w http.ResponseWriter, r *http.Request) {
	courseIDStr := strings.TrimPrefix(r.URL.Path, "/api/v1/courses/")
	courseIDStr = strings.TrimSuffix(courseIDStr, "/grade-components")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	components, err := h.usecase.GetByCourseID(courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Grade components retrieved successfully",
		"data":    components,
	})
}

// UpdateGradeComponent updates a grade component
func (h *GradeComponentHandler) UpdateGradeComponent(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/v1/grade-components/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid grade component ID", http.StatusBadRequest)
		return
	}

	var req UpdateGradeComponentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	gc, err := h.usecase.Update(id, req.Name, req.Weight, req.Type)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gc)
}

// DeleteGradeComponent deletes a grade component
func (h *GradeComponentHandler) DeleteGradeComponent(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/v1/grade-components/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid grade component ID", http.StatusBadRequest)
		return
	}

	if err := h.usecase.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
