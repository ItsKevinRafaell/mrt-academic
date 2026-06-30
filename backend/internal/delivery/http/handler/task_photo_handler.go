package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"mrt-backend/internal/usecase"
)

type TaskPhotoHandler struct {
	usecase *usecase.TaskPhotoUsecase
}

func NewTaskPhotoHandler(u *usecase.TaskPhotoUsecase) *TaskPhotoHandler {
	return &TaskPhotoHandler{usecase: u}
}

func (h *TaskPhotoHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_REQUEST", "Failed to parse form data")
		return
	}

	taskID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid task ID")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_FILE_REQUIRED", "File is required")
		return
	}
	defer file.Close()

	caption := r.FormValue("caption")

	userID := r.Context().Value("user_id")
	userIDStr := ""
	if userID != nil {
		userIDStr = fmt.Sprintf("%v", userID)
	}

	photo, err := h.usecase.AddPhoto(taskID, file, header, caption, userIDStr)
	if err != nil {
		if strings.Contains(err.Error(), "file size") {
			writeError(w, http.StatusBadRequest, "ERR_FILE_TOO_LARGE", err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "ERR_UPLOAD_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, "Photo uploaded", photo)
}

func (h *TaskPhotoHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid task ID")
		return
	}

	photos, err := h.usecase.GetPhotos(taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_GET_PHOTOS", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "OK", photos)
}

func (h *TaskPhotoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	photoID, err := strconv.Atoi(r.PathValue("photo_id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ERR_INVALID_ID", "Invalid photo ID")
		return
	}

	if err := h.usecase.DeletePhoto(photoID); err != nil {
		writeError(w, http.StatusInternalServerError, "ERR_DELETE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, "Photo deleted", nil)
}

func writeJSON(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"message":   message,
		"data":      data,
	})
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    false,
		"message":    message,
		"error_code": code,
	})
}
