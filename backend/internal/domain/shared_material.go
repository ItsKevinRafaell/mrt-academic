package domain

import (
	"time"
)

type SharedMaterial struct {
	ID             int       `json:"id"`
	RequestID      int       `json:"request_id"`
	MaterialID     int       `json:"material_id"`
	TargetCourseID int       `json:"target_course_id"`
	SourceCourseID int       `json:"source_course_id"`
	SharedBy       string    `json:"shared_by"`
	SharedAt       time.Time `json:"shared_at"`
	IsActive       bool      `json:"is_active"`
}

type SharedMaterialWithDetails struct {
	SharedMaterial
	Material     *Material `json:"material,omitempty"`
	SourceCourse *Course    `json:"source_course,omitempty"`
	TargetCourse *Course    `json:"target_course,omitempty"`
}

type AvailableMaterial struct {
	MaterialID       int     `json:"material_id"`
	MaterialTitle    string  `json:"material_title"`
	MaterialType     string  `json:"material_type"`
	MaterialURL      string  `json:"material_url"`
	CourseID         int     `json:"course_id"`
	CourseName       string  `json:"course_name"`
	CourseCode       string  `json:"course_code"`
	HasPendingRequest bool   `json:"has_pending_request"`
	RequestID        *int    `json:"request_id,omitempty"`
}
