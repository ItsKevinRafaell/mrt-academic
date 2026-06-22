package handler

import (
	"encoding/json"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
	"net/http"
	"strconv"
)

type BankSoalHandler struct {
	bankSoalUsecase *usecase.BankSoalUsecase
}

func NewBankSoalHandler(bankSoalUsecase *usecase.BankSoalUsecase) *BankSoalHandler {
	return &BankSoalHandler{bankSoalUsecase: bankSoalUsecase}
}

// Exam Archive handlers
func (h *BankSoalHandler) CreateExamArchive(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateExamArchiveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	archive, err := h.bankSoalUsecase.CreateExamArchive(r.Context(), req)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(archive)
}

func (h *BankSoalHandler) GetExamArchives(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.URL.Query().Get("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid course_id"}`, http.StatusBadRequest)
		return
	}

	archives, err := h.bankSoalUsecase.GetExamArchives(r.Context(), courseID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(archives)
}

func (h *BankSoalHandler) GetExamArchiveByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	archive, err := h.bankSoalUsecase.GetExamArchiveByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(archive)
}

func (h *BankSoalHandler) UpdateExamArchive(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	var req domain.UpdateExamArchiveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	archive, err := h.bankSoalUsecase.UpdateExamArchive(r.Context(), id, req)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(archive)
}

func (h *BankSoalHandler) DeleteExamArchive(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	if err := h.bankSoalUsecase.DeleteExamArchive(r.Context(), id); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
}

// Simulation handlers
func (h *BankSoalHandler) CreateSimulation(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateSimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	simulation, err := h.bankSoalUsecase.CreateSimulation(r.Context(), req)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(simulation)
}

func (h *BankSoalHandler) GetSimulations(w http.ResponseWriter, r *http.Request) {
	courseIDStr := r.URL.Query().Get("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid course_id"}`, http.StatusBadRequest)
		return
	}

	simulations, err := h.bankSoalUsecase.GetSimulations(r.Context(), courseID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(simulations)
}

func (h *BankSoalHandler) GetSimulationByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	simulation, err := h.bankSoalUsecase.GetSimulationByID(r.Context(), id)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(simulation)
}

func (h *BankSoalHandler) UpdateSimulation(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	var req domain.UpdateSimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	simulation, err := h.bankSoalUsecase.UpdateSimulation(r.Context(), id, req)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(simulation)
}

func (h *BankSoalHandler) DeleteSimulation(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	if err := h.bankSoalUsecase.DeleteSimulation(r.Context(), id); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
}

// Question handlers
func (h *BankSoalHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	var question domain.SimulationQuestion
	if err := json.NewDecoder(r.Body).Decode(&question); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if err := h.bankSoalUsecase.CreateQuestion(r.Context(), &question); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(question)
}

func (h *BankSoalHandler) GetQuestionsBySimulation(w http.ResponseWriter, r *http.Request) {
	simulationIDStr := r.URL.Query().Get("simulation_id")
	simulationID, err := strconv.Atoi(simulationIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid simulation_id"}`, http.StatusBadRequest)
		return
	}

	questions, err := h.bankSoalUsecase.GetQuestionsBySimulation(r.Context(), simulationID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func (h *BankSoalHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	var question domain.SimulationQuestion
	if err := json.NewDecoder(r.Body).Decode(&question); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	question.ID = id

	if err := h.bankSoalUsecase.UpdateQuestion(r.Context(), &question); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(question)
}

func (h *BankSoalHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}

	if err := h.bankSoalUsecase.DeleteQuestion(r.Context(), id); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
}
