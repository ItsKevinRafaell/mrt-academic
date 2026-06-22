package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
)

type NoteHandler struct {
	usecase *usecase.NoteUsecase
}

func NewNoteHandler(usecase *usecase.NoteUsecase) *NoteHandler {
	return &NoteHandler{usecase: usecase}
}

type createNoteRequest struct {
	Title     string   `json:"title"`
	Content   string   `json:"content"`
	CourseID  *int     `json:"course_id"`
	SessionID *int     `json:"session_id"`
	Tags      []string `json:"tags"`
}

type updateNoteRequest struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

func (h *NoteHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var req createNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request", "ERR_VALIDATION")
		return
	}
	note, err := h.usecase.CreateNote(userID, req.Title, req.Content, req.CourseID, req.SessionID, req.Tags)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
		return
	}
	Success(w, http.StatusCreated, "Note created", note)
}

func (h *NoteHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	sessionIDStr := r.URL.Query().Get("session_id")
	courseIDStr := r.URL.Query().Get("course_id")

	var notes []struct {
		ID        string   `json:"id"`
		Title     string   `json:"title"`
		Content   string   `json:"content"`
		CourseID  *int     `json:"course_id"`
		SessionID *int     `json:"session_id"`
		Tags      []string `json:"tags"`
		CreatedAt string   `json:"created_at"`
		UpdatedAt string   `json:"updated_at"`
	}

	if sessionIDStr != "" {
		sessionID, _ := strconv.Atoi(sessionIDStr)
		result, err := h.usecase.GetNotesBySession(userID, sessionID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
			return
		}
		for _, n := range result {
			notes = append(notes, struct {
				ID        string   `json:"id"`
				Title     string   `json:"title"`
				Content   string   `json:"content"`
				CourseID  *int     `json:"course_id"`
				SessionID *int     `json:"session_id"`
				Tags      []string `json:"tags"`
				CreatedAt string   `json:"created_at"`
				UpdatedAt string   `json:"updated_at"`
			}{n.ID, n.Title, n.Content, n.CourseID, n.SessionID, n.Tags, n.CreatedAt, n.UpdatedAt})
		}
	} else if courseIDStr != "" {
		_, _ = strconv.Atoi(courseIDStr)
		result, err := h.usecase.GetAllNotes(userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
			return
		}
		for _, n := range result {
			notes = append(notes, struct {
				ID        string   `json:"id"`
				Title     string   `json:"title"`
				Content   string   `json:"content"`
				CourseID  *int     `json:"course_id"`
				SessionID *int     `json:"session_id"`
				Tags      []string `json:"tags"`
				CreatedAt string   `json:"created_at"`
				UpdatedAt string   `json:"updated_at"`
			}{n.ID, n.Title, n.Content, n.CourseID, n.SessionID, n.Tags, n.CreatedAt, n.UpdatedAt})
		}
	} else {
		result, err := h.usecase.GetAllNotes(userID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
			return
		}
		for _, n := range result {
			notes = append(notes, struct {
				ID        string   `json:"id"`
				Title     string   `json:"title"`
				Content   string   `json:"content"`
				CourseID  *int     `json:"course_id"`
				SessionID *int     `json:"session_id"`
				Tags      []string `json:"tags"`
				CreatedAt string   `json:"created_at"`
				UpdatedAt string   `json:"updated_at"`
			}{n.ID, n.Title, n.Content, n.CourseID, n.SessionID, n.Tags, n.CreatedAt, n.UpdatedAt})
		}
	}
	Success(w, http.StatusOK, "Notes retrieved", notes)
}

func (h *NoteHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id := r.PathValue("id")
	var req updateNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request", "ERR_VALIDATION")
		return
	}
	note, err := h.usecase.UpdateNote(userID, id, req.Title, req.Content, req.Tags)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
		return
	}
	Success(w, http.StatusOK, "Note updated", note)
}

func (h *NoteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id := r.PathValue("id")
	if err := h.usecase.DeleteNote(userID, id); err != nil {
		Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
		return
	}
	Success(w, http.StatusOK, "Note deleted", nil)
}
