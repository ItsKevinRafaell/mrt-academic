package handler

import (
	"encoding/json"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type GradeHandler struct {
	gradeUsecase *usecase.GradeUsecase
}

func NewGradeHandler(gradeUsecase *usecase.GradeUsecase) *GradeHandler {
	return &GradeHandler{gradeUsecase: gradeUsecase}
}

type CreateGradeRequest struct {
	CourseID int    `json:"course_id"`
	Grade    string `json:"grade"`
}

func (h *GradeHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	var req CreateGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	validGrades := map[string]bool{
		"A": true, "A-": true, "B+": true, "B": true, "B-": true,
		"C+": true, "C": true, "D": true, "E": true,
	}
	if !validGrades[req.Grade] {
		respondError(w, http.StatusBadRequest, "invalid_grade", "Invalid grade value")
		return
	}

	err := h.gradeUsecase.CreateGrade(userID, req.CourseID, req.Grade)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{"message": "Grade created successfully"})
}

func (h *GradeHandler) GetUserGrades(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	grades, err := h.gradeUsecase.GetUserGrades(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, grades)
}

func (h *GradeHandler) CalculateGPA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	summary, err := h.gradeUsecase.CalculateGPA(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "calculation_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, summary)
}

func (h *GradeHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_course_id", "Invalid course ID")
		return
	}

	var req CreateGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	validGrades := map[string]bool{
		"A": true, "A-": true, "B+": true, "B": true, "B-": true,
		"C+": true, "C": true, "D": true, "E": true,
	}
	if !validGrades[req.Grade] {
		respondError(w, http.StatusBadRequest, "invalid_grade", "Invalid grade value")
		return
	}

	err = h.gradeUsecase.CreateGrade(userID, courseID, req.Grade)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Grade updated successfully"})
}
