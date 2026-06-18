package handler

import (
	"fmt"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type ExcelHandler struct {
	excelUsecase *usecase.ExcelUsecase
}

func NewExcelHandler(excelUsecase *usecase.ExcelUsecase) *ExcelHandler {
	return &ExcelHandler{excelUsecase: excelUsecase}
}

func (h *ExcelHandler) ExportGrades(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		Error(w, http.StatusUnauthorized, "Unauthorized", "ERR_UNAUTHORIZED")
		return
	}

	cawuStr := r.URL.Query().Get("cawu")
	cawu := 0
	if cawuStr != "" {
		cawu, _ = strconv.Atoi(cawuStr)
	}

	data, err := h.excelUsecase.ExportGrades(userID, cawu)
	if err != nil {
		handleError(w, err)
		return
	}

	filename := "nilai-semua-cawu.xlsx"
	if cawu > 0 {
		filename = fmt.Sprintf("nilai-cawu-%d.xlsx", cawu)
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	w.Write(data)
}

func (h *ExcelHandler) ExportCourses(w http.ResponseWriter, r *http.Request) {
	data, err := h.excelUsecase.ExportCourses()
	if err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=mrt-courses.xlsx")
	w.Write(data)
}

func (h *ExcelHandler) ExportTemplate(w http.ResponseWriter, r *http.Request) {
	data, err := h.excelUsecase.ExportTemplate()
	if err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=mrt-template.xlsx")
	w.Write(data)
}

func (h *ExcelHandler) ImportCourses(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		Error(w, http.StatusBadRequest, "Invalid file upload", "ERR_VALIDATION")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		Error(w, http.StatusBadRequest, "File is required", "ERR_VALIDATION")
		return
	}
	defer file.Close()

	result, err := h.excelUsecase.ImportCourses(file)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Import successful", result)
}

func (h *ExcelHandler) PreviewImport(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		Error(w, http.StatusBadRequest, "Invalid file upload", "ERR_VALIDATION")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		Error(w, http.StatusBadRequest, "File is required", "ERR_VALIDATION")
		return
	}
	defer file.Close()

	preview, err := h.excelUsecase.PreviewImport(file)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Preview generated", preview)
}
