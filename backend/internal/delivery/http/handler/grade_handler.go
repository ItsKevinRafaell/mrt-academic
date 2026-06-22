package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
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

func (h *GradeHandler) GetGradesForCourse(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	courseIDStr := r.URL.Query().Get("course_id")
	if courseIDStr == "" {
		respondError(w, http.StatusBadRequest, "invalid_course_id", "course_id query parameter is required")
		return
	}

	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_course_id", "Invalid course_id")
		return
	}

	components, err := h.gradeUsecase.GetGradesForCourse(userID, courseID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, components)
}

func (h *GradeHandler) GetIPKData(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	cawuStr := r.URL.Query().Get("cawu")

	allData, err := h.gradeUsecase.GetIPKData(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	if cawuStr != "" {
		cawuID, parseErr := strconv.Atoi(cawuStr)
		if parseErr == nil {
			filtered := make([]domain.IPKData, 0)
			for _, d := range allData {
				if d.CawuID == cawuID {
					filtered = append(filtered, d)
				}
			}
			allData = filtered
		}
	}

	respondJSON(w, http.StatusOK, allData)
}

func (h *GradeHandler) UpdateGrade(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	var req domain.UpdateGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if req.CourseID == 0 {
		respondError(w, http.StatusBadRequest, "invalid_course_id", "Course ID is required")
		return
	}

	if req.Grade != nil {
		validGrades := map[string]bool{
			"A": true, "A-": true, "B+": true, "B": true, "B-": true,
			"C+": true, "C": true, "D": true, "E": true,
		}
		if !validGrades[*req.Grade] {
			respondError(w, http.StatusBadRequest, "invalid_grade", "Invalid grade value")
			return
		}
	}

	err := h.gradeUsecase.CreateGrade(userID, req.CourseID, *req.Grade)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "update_failed", err.Error())
		return
	}

	ipkData, err := h.gradeUsecase.GetIPKData(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "fetch_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, ipkData)
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

type BulkGradeRequest struct {
	Grades []struct {
		ComponentID int     `json:"component_id"`
		Score       float64 `json:"score"`
	} `json:"grades"`
}

func (h *GradeHandler) BulkCreate(w http.ResponseWriter, r *http.Request) {
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

	var req BulkGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if len(req.Grades) == 0 {
		respondError(w, http.StatusBadRequest, "empty_grades", "Grades array cannot be empty")
		return
	}

	// Validate all scores
	for _, g := range req.Grades {
		if g.Score < 0 || g.Score > 100 {
			respondError(w, http.StatusBadRequest, "invalid_score", "Score must be between 0 and 100")
			return
		}
		if g.ComponentID == 0 {
			respondError(w, http.StatusBadRequest, "invalid_component_id", "Component ID is required")
			return
		}
	}

	// Convert to BulkGradeInput
	var grades []domain.BulkGradeInput
	for _, g := range req.Grades {
		grades = append(grades, domain.BulkGradeInput{
			ComponentID: g.ComponentID,
			Score:       g.Score,
		})
	}

	err = h.gradeUsecase.CreateBulkGrades(userID, courseID, grades)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "create_failed", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{"message": "Grades submitted successfully"})
}

func convertScoreToGrade(score float64) string {
	switch {
	case score >= 85:
		return "A"
	case score >= 80:
		return "A-"
	case score >= 75:
		return "B+"
	case score >= 70:
		return "B"
	case score >= 65:
		return "B-"
	case score >= 60:
		return "C+"
	case score >= 55:
		return "C"
	case score >= 40:
		return "D"
	default:
		return "E"
	}
}
