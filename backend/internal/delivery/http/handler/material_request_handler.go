package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type MaterialRequestHandler struct {
	useCase *usecase.MaterialRequestUseCase
}

func NewMaterialRequestHandler(useCase *usecase.MaterialRequestUseCase) *MaterialRequestHandler {
	return &MaterialRequestHandler{useCase: useCase}
}

func (h *MaterialRequestHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	var input domain.CreateMaterialRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	if input.RequestingCourseID == 0 || input.MaterialID == 0 || input.RequestedBy == "" || input.Purpose == "" {
		Error(w, http.StatusBadRequest, "Missing required fields", "ERR_VALIDATION")
		return
	}

	req, err := h.useCase.CreateRequest(input)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), "ERR_VALIDATION")
		return
	}

	Success(w, http.StatusCreated, "Request created", req)
}

func (h *MaterialRequestHandler) ListRequests(w http.ResponseWriter, r *http.Request) {
	filter := domain.MaterialRequestFilter{
		Status:             r.URL.Query().Get("status"),
		RequestingCourseID: 0,
	}

	if courseIDStr := r.URL.Query().Get("my_course"); courseIDStr != "" {
		if id, err := strconv.Atoi(courseIDStr); err == nil {
			filter.RequestingCourseID = id
		}
	}

	requests, err := h.useCase.ListRequests(filter)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Requests retrieved", requests)
}

func (h *MaterialRequestHandler) GetRequest(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathParam(r, "id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid request ID", "ERR_VALIDATION")
		return
	}

	request, err := h.useCase.GetRequest(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Request retrieved", request)
}

func (h *MaterialRequestHandler) ReviewRequest(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathParam(r, "id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid request ID", "ERR_VALIDATION")
		return
	}

	var input domain.ReviewMaterialRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	if input.ReviewedBy == "" || (input.Status != "approved" && input.Status != "rejected") {
		Error(w, http.StatusBadRequest, "Missing required fields", "ERR_VALIDATION")
		return
	}

	req, err := h.useCase.ReviewRequest(id, input)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Request reviewed", req)
}

func (h *MaterialRequestHandler) GetSharedMaterials(w http.ResponseWriter, r *http.Request) {
	courseID, err := parsePathParam(r, "courseId")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid course ID", "ERR_VALIDATION")
		return
	}

	materials, err := h.useCase.GetSharedMaterials(courseID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Shared materials retrieved", materials)
}

func (h *MaterialRequestHandler) GetPendingCount(w http.ResponseWriter, r *http.Request) {
	count, err := h.useCase.GetPendingCount()
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Pending count retrieved", map[string]int{"pending_count": count})
}
