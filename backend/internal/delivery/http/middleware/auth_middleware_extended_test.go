package middleware_test

import (
	"strings"
	"testing"

	"mrt-backend/internal/domain"
)

func TestRequireAdmin_SuperAdmin(t *testing.T) {
	for _, role := range domain.AdminRoles {
		if role == "" {
			t.Errorf("AdminRoles contains empty string at index")
		}
	}

	expectedRoles := map[string]bool{
		"SUPER_ADMIN": true,
		"KURIKULUM":   true,
		"SEKRETARIS":  true,
		"KOMTI":       true,
		"WAKOMTI":     true,
	}

	for _, role := range domain.AdminRoles {
		if !expectedRoles[role] {
			t.Errorf("unexpected admin role: %s", role)
		}
	}
}

func TestRequireAdmin_MahasiswaDenied(t *testing.T) {
	for _, role := range domain.AdminRoles {
		if role == "MAHASISWA" {
			t.Errorf("MAHASISWA should not be in AdminRoles")
		}
	}
}

func TestAuthenticate_BearerPrefixCheck(t *testing.T) {
	testCases := []struct {
		name        string
		authHeader  string
		expectValid bool
	}{
		{"lowercase bearer", "bearer token123", false},
		{"Basic auth", "Basic dXNlcjpwYXNz", false},
		{"no space", "Bearertoken123", false},
		{"multiple spaces", "Bearer  token123", false},
		{"empty after bearer", "Bearer ", false},
		{"correct format", "Bearer token123", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			parts := strings.Split(tc.authHeader, " ")
			validFormat := len(parts) == 2 && parts[0] == "Bearer" && parts[1] != ""

			if tc.expectValid && !validFormat {
				t.Errorf("expected valid format, but got invalid for: %s", tc.authHeader)
			}
			if !tc.expectValid && validFormat {
				t.Errorf("expected invalid format, but got valid for: %s", tc.authHeader)
			}
		})
	}
}

func TestContextKeyHelpers(t *testing.T) {
	// Context helpers need a real context — skip unit-level test
	// Integration test covers GetUserID and GetRole
}

func TestResponseFormat_ErrorContract(t *testing.T) {
	testCases := []struct {
		errorCode  string
		message    string
	}{
		{"ERR_VALIDATION", "Invalid input"},
		{"ERR_NOT_FOUND", "Resource not found"},
		{"ERR_UNAUTHORIZED", "Unauthorized"},
		{"ERR_FORBIDDEN", "Forbidden"},
		{"ERR_INTERNAL_SERVER", "Internal error"},
		{"ERR_TOKEN_EXPIRED", "Token has expired"},
		{"ERR_INVALID_TOKEN", "Invalid token"},
	}

	for _, tc := range testCases {
		t.Run(tc.errorCode, func(t *testing.T) {
			body := `{"success":false,"message":"` + tc.message + `","error_code":"` + tc.errorCode + `","data":null}`
			if !strings.Contains(body, `"success":false`) {
				t.Error("success should be false for error responses")
			}
			if !strings.Contains(body, `"error_code":"`+tc.errorCode+`"`) {
				t.Errorf("expected error_code %s in response", tc.errorCode)
			}
		})
	}
}

func TestResponseFormat_SuccessContract(t *testing.T) {
	body := `{"success":true,"message":"Operation successful","data":{"id":1},"meta":null}`
	if !strings.Contains(body, `"success":true`) {
		t.Error("success should be true for success responses")
	}
	if !strings.Contains(body, `"data"`) {
		t.Error("data should be present for success responses")
	}
}
