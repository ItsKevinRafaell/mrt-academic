package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"mrt-backend/internal/domain"
)

type QuestionHandler struct {
	questionUC domain.QuestionUseCase
}

func NewQuestionHandler(questionUC domain.QuestionUseCase) *QuestionHandler {
	return &QuestionHandler{questionUC: questionUC}
}

type createQuestionRequest struct {
	CourseID        int                       `json:"course_id"`
	SessionID       *int                      `json:"session_id,omitempty"`
	Title           string                    `json:"title"`
	QuestionText    string                    `json:"question_text"`
	Type            domain.QuestionType       `json:"type"`
	Options         []domain.QuestionOption   `json:"options,omitempty"`
	AnswerKey       *string                   `json:"answer_key,omitempty"`
	DifficultyLevel domain.DifficultyLevel    `json:"difficulty_level"`
	TimeLimitMin    *int                      `json:"time_limit_minutes,omitempty"`
	ExternalURL     *string                   `json:"external_url,omitempty"`
}

type updateQuestionRequest struct {
	SessionID       *int                      `json:"session_id,omitempty"`
	Title           string                    `json:"title"`
	QuestionText    string                    `json:"question_text"`
	Type            domain.QuestionType       `json:"type"`
	Options         []domain.QuestionOption   `json:"options,omitempty"`
	AnswerKey       *string                   `json:"answer_key,omitempty"`
	DifficultyLevel domain.DifficultyLevel    `json:"difficulty_level"`
	TimeLimitMin    *int                      `json:"time_limit_minutes,omitempty"`
	ExternalURL     *string                   `json:"external_url,omitempty"`
}

type submitExamRequest struct {
	Answers      []domain.SubmittedAnswer `json:"answers"`
	TimeSpentSec int                      `json:"time_spent_seconds"`
}

func (h *QuestionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	question := &domain.Question{
		CourseID:        req.CourseID,
		SessionID:       req.SessionID,
		Title:           req.Title,
		QuestionText:    req.QuestionText,
		Type:            req.Type,
		Options:         req.Options,
		AnswerKey:       req.AnswerKey,
		DifficultyLevel: req.DifficultyLevel,
		TimeLimitMin:    req.TimeLimitMin,
		ExternalURL:     req.ExternalURL,
	}

	if err := h.questionUC.Create(question); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(question)
}

func (h *QuestionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	question, err := h.questionUC.GetByID(id)
	if err != nil {
		if err == domain.ErrNotFound {
			http.Error(w, "Question not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(question)
}

func (h *QuestionHandler) GetByCourseID(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.PathValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course_id", http.StatusBadRequest)
		return
	}

	questions, err := h.questionUC.GetByCourseID(courseID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func (h *QuestionHandler) GetBySessionID(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := r.PathValue("session_id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		http.Error(w, "invalid session_id", http.StatusBadRequest)
		return
	}

	questions, err := h.questionUC.GetBySessionID(sessionID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func (h *QuestionHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req updateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	question := &domain.Question{
		ID:              id,
		SessionID:       req.SessionID,
		Title:           req.Title,
		QuestionText:    req.QuestionText,
		Type:            req.Type,
		Options:         req.Options,
		AnswerKey:       req.AnswerKey,
		DifficultyLevel: req.DifficultyLevel,
		TimeLimitMin:    req.TimeLimitMin,
		ExternalURL:     req.ExternalURL,
	}

	if err := h.questionUC.Update(question); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(question)
}

func (h *QuestionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if err := h.questionUC.Delete(id); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *QuestionHandler) SubmitExam(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req submitExamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value("user_id").(string)

	submission := &domain.ExamSubmission{
		UserID:       userID,
		QuestionID:   id,
		Answers:      req.Answers,
		TimeSpentSec: req.TimeSpentSec,
	}

	if err := h.questionUC.SubmitExam(submission); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(submission)
}

func (h *QuestionHandler) GetSubmissions(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	submissions, err := h.questionUC.GetSubmissionsByQuestion(id)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

func (h *QuestionHandler) GetUserSubmissions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	submissions, err := h.questionUC.GetSubmissionsByUser(userID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}
