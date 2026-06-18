package handler

import (
	"encoding/json"
	"net/http"
	"reflect"
)

type Response struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data"`
	ErrorCode string      `json:"error_code,omitempty"`
	Meta      interface{} `json:"meta,omitempty"`
}

func normalizeNilSlices(data interface{}) interface{} {
	if data == nil {
		return nil
	}
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Slice && v.IsNil() {
		return reflect.MakeSlice(v.Type(), 0, 0).Interface()
	}
	return data
}

func Success(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: message,
		Data:    normalizeNilSlices(data),
	})
}

func SuccessWithMeta(w http.ResponseWriter, status int, message string, data interface{}, meta interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: message,
		Data:    normalizeNilSlices(data),
		Meta:    meta,
	})
}

func Error(w http.ResponseWriter, status int, message string, errorCode string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success:   false,
		Message:   message,
		ErrorCode: errorCode,
	})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "OK",
		Data:    normalizeNilSlices(data),
	})
}

func respondError(w http.ResponseWriter, status int, errorCode string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Success:   false,
		Message:   message,
		ErrorCode: errorCode,
	})
}
