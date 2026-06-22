package handler

import (
	"errors"
	"mrt-backend/internal/domain"
	"net/http"
)

func handleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		Error(w, http.StatusBadRequest, "Validation error", "ERR_VALIDATION")
	case errors.Is(err, domain.ErrUnauthorized):
		Error(w, http.StatusUnauthorized, "Unauthorized", "ERR_UNAUTHORIZED")
	case errors.Is(err, domain.ErrForbidden):
		Error(w, http.StatusForbidden, "Access denied", "ERR_FORBIDDEN")
	case errors.Is(err, domain.ErrNotFound):
		Error(w, http.StatusNotFound, "Resource not found", "ERR_NOT_FOUND")
	case errors.Is(err, domain.ErrAlreadyExists):
		Error(w, http.StatusConflict, "Resource already exists", "ERR_ALREADY_EXISTS")
	case errors.Is(err, domain.ErrInvalidToken):
		Error(w, http.StatusUnauthorized, "Invalid token", "ERR_INVALID_TOKEN")
	case errors.Is(err, domain.ErrTokenExpired):
		Error(w, http.StatusUnauthorized, "Token expired", "ERR_TOKEN_EXPIRED")
	default:
		Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
	}
}
