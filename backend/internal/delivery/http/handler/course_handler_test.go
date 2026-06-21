package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mrt-backend/internal/domain"
	"mrt-backend/internal/delivery/http/middleware"
)

func withAuthContext(r *http.Request, userID, email, role string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.ContextKeyUserID, userID)
	ctx = context.WithValue(ctx, middleware.ContextKeyEmail, email)
	ctx = context.WithValue(ctx, middleware.ContextKeyRole, role)
	return r.WithContext(ctx)
}

func parseResponse(t *testing.T, rr *httptest.ResponseRecorder) Response {
	t.Helper()
	var resp Response
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	return resp
}

func TestCourseHandler_List_Success(t *testing.T) {
	courses := []domain.Course{
		{ID: 1, Code: "CS101", Name: "Struktur Data", SKS: 3},
		{ID: 2, Code: "CS102", Name: "Algoritma", SKS: 3},
	}
	uc := newStubCourseUsecase(courses, nil)
	h := NewCourseHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/courses", nil)
	rr := httptest.NewRecorder()

	h.List(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	resp := parseResponse(t, rr)
	if !resp.Success {
		t.Error("expected success true")
	}
}

func TestCourseHandler_Create_Success(t *testing.T) {
	uc := newStubCourseUsecase(nil, nil)
	h := NewCourseHandler(uc)

	body := `{"code":"CS101","name":"Struktur Data","sks":3,"course_type":"lecturer"}`
	req := httptest.NewRequest("POST", "/api/v1/courses", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.Create(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rr.Code)
	}

	resp := parseResponse(t, rr)
	if !resp.Success {
		t.Error("expected success true")
	}
}

func TestCourseHandler_Create_ValidationError(t *testing.T) {
	uc := newStubCourseUsecase(nil, nil)
	h := NewCourseHandler(uc)

	body := `{"code":"","name":"","sks":0}`
	req := httptest.NewRequest("POST", "/api/v1/courses", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	h.Create(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}
}

func TestCourseHandler_GetByID_Success(t *testing.T) {
	courses := []domain.Course{
		{ID: 1, Code: "CS101", Name: "Struktur Data", SKS: 3},
	}
	uc := newStubCourseUsecase(courses, nil)
	h := NewCourseHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/courses/1", nil)
	req.SetPathValue("id", "1")
	rr := httptest.NewRecorder()

	h.GetByID(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}

func TestCourseHandler_GetByID_NotFound(t *testing.T) {
	uc := newStubCourseUsecase(nil, domain.ErrNotFound)
	h := NewCourseHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/courses/999", nil)
	req.SetPathValue("id", "999")
	rr := httptest.NewRecorder()

	h.GetByID(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", rr.Code)
	}
}

func TestCourseHandler_GetByID_InvalidID(t *testing.T) {
	uc := newStubCourseUsecase(nil, nil)
	h := NewCourseHandler(uc)

	req := httptest.NewRequest("GET", "/api/v1/courses/abc", nil)
	req.SetPathValue("id", "abc")
	rr := httptest.NewRecorder()

	h.GetByID(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}
}
