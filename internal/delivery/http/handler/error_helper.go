package handler

import (
	"errors"
	"mrt-backend/internal/domain"
	"net/http"
)

func handleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		Error(w, http.StatusBadRequest, err.Error(), "ERR_VALIDATION")
	case errors.Is(err, domain.ErrUnauthorized):
		Error(w, http.StatusUnauthorized, err.Error(), "ERR_UNAUTHORIZED")
	case errors.Is(err, domain.ErrForbidden):
		Error(w, http.StatusForbidden, err.Error(), "ERR_FORBIDDEN")
	case errors.Is(err, domain.ErrNotFound):
		Error(w, http.StatusNotFound, err.Error(), "ERR_NOT_FOUND")
	case errors.Is(err, domain.ErrAlreadyExists):
		Error(w, http.StatusConflict, err.Error(), "ERR_ALREADY_EXISTS")
	case errors.Is(err, domain.ErrInvalidToken):
		Error(w, http.StatusUnauthorized, err.Error(), "ERR_INVALID_TOKEN")
	case errors.Is(err, domain.ErrTokenExpired):
		Error(w, http.StatusUnauthorized, err.Error(), "ERR_TOKEN_EXPIRED")
	default:
		Error(w, http.StatusInternalServerError, "Internal server error", "ERR_INTERNAL_SERVER")
	}
}
