package handler

import (
	"encoding/json"
	"net/http"

	"mrt-backend/internal/usecase"
)

type UserHandler struct {
	userUC *usecase.UserUseCase
}

func NewUserHandler(userUC *usecase.UserUseCase) *UserHandler {
	return &UserHandler{userUC: userUC}
}

type UpdateRoleRequest struct {
	Role string `json:"role"`
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userUC.GetAllUsers()
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "users_retrieved", users)
}

func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		Error(w, http.StatusBadRequest, "user ID is required", "invalid_request")
		return
	}

	user, err := h.userUC.GetUserByID(id)
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "user_retrieved", user)
}

func (h *UserHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		Error(w, http.StatusBadRequest, "user ID is required", "invalid_request")
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "invalid request body", "invalid_request")
		return
	}

	if err := h.userUC.UpdateUserRole(id, req.Role); err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "role_updated", map[string]string{"message": "role updated successfully"})
}

func (h *UserHandler) GetAvailableRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.userUC.GetAvailableRoles()
	if err != nil {
		handleError(w, err)
		return
	}

	Success(w, http.StatusOK, "roles_retrieved", roles)
}
