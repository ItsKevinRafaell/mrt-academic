package domain

import "errors"

var (
	ErrNotFound       = errors.New("resource not found")
	ErrValidation     = errors.New("validation error")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrForbidden      = errors.New("forbidden")
	ErrInternal       = errors.New("internal server error")
	ErrAlreadyExists  = errors.New("resource already exists")
	ErrInvalidToken   = errors.New("invalid token")
	ErrTokenExpired   = errors.New("token expired")
)
