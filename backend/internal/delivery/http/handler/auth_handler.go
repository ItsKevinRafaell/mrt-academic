package handler

import (
	"encoding/json"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/usecase"
	"net/http"
)

type AuthHandler struct {
	authUsecase *usecase.AuthUsecase
}

func NewAuthHandler(authUsecase *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

type RegisterRequest struct {
	NIM      string `json:"nim"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	user, err := h.authUsecase.Register(r.Context(), usecase.RegisterRequest{
		NIM:      req.NIM,
		FullName: req.FullName,
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusCreated, "User registered successfully", user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "Invalid request body", "ERR_VALIDATION")
		return
	}

	response, err := h.authUsecase.Login(r.Context(), usecase.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Login successful", map[string]interface{}{
		"token": response.Token,
		"user":  response.User,
		"role":  response.Role,
	})
}

func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		Error(w, http.StatusUnauthorized, "User not authenticated", "ERR_UNAUTHORIZED")
		return
	}

	user, role, err := h.authUsecase.GetCurrentUser(r.Context(), userID)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "Current user retrieved", map[string]interface{}{
		"user": user,
		"role": role,
	})
}
