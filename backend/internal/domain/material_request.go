package domain

import (
	"time"
)

type MaterialRequestStatus string

const (
	RequestStatusPending  MaterialRequestStatus = "pending"
	RequestStatusApproved MaterialRequestStatus = "approved"
	RequestStatusRejected MaterialRequestStatus = "rejected"
)

type MaterialRequest struct {
	ID                 int                    `json:"id"`
	RequestingCourseID int                    `json:"requesting_course_id"`
	RequestedBy        string                 `json:"requested_by"`
	Purpose            string                 `json:"purpose"`
	MaterialID         int                    `json:"material_id"`
	RequestedAt        time.Time              `json:"requested_at"`
	ReviewedAt         *time.Time             `json:"reviewed_at,omitempty"`
	ReviewedBy         *string                `json:"reviewed_by,omitempty"`
	Status             MaterialRequestStatus  `json:"status"`
	ReviewNote         string                 `json:"review_note,omitempty"`
	IsActive           bool                   `json:"is_active"`
}

type MaterialRequestWithDetails struct {
	MaterialRequest
	Material           *Material `json:"material,omitempty"`
	RequestingCourse   *Course    `json:"requesting_course,omitempty"`
	SourceCourse       *Course    `json:"source_course,omitempty"`
	RequestedByUser    *User      `json:"requested_by_user,omitempty"`
	ReviewedByUser     *User      `json:"reviewed_by_user,omitempty"`
}

type CreateMaterialRequestInput struct {
	RequestingCourseID int    `json:"requesting_course_id"`
	RequestedBy        string `json:"requested_by"`
	MaterialID         int    `json:"material_id"`
	Purpose            string `json:"purpose"`
}

type ReviewMaterialRequestInput struct {
	ReviewedBy   string `json:"reviewed_by"`
	Status       string `json:"status"`
	ReviewNote   string `json:"review_note,omitempty"`
}

type MaterialRequestFilter struct {
	Status             string
	RequestingCourseID int
	MyCourse           bool
}
