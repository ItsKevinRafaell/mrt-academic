package domain

import "time"

type Grade struct {
	ID          int       `json:"id"`
	UserID      string    `json:"user_id"`
	CourseID    int       `json:"course_id"`
	ComponentID int       `json:"component_id"`
	Grade       string    `json:"grade"`
	Score       float64   `json:"score"`
	Course      Course    `json:"course,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BulkGradeInput struct {
	ComponentID int     `json:"component_id"`
	Score       float64 `json:"score"`
}

type BulkGradeRequest struct {
	Grades []BulkGradeInput `json:"grades"`
}

type GPAPerCawu struct {
	CawuName string  `json:"cawu_name"`
	GPA      float64 `json:"gpa"`
	SKS      int     `json:"sks"`
}

type GPASummary struct {
	CumulativeGPA float64      `json:"cumulative_gpa"`
	TotalSKS      int          `json:"total_sks"`
	PerCawu       []GPAPerCawu `json:"per_cawu"`
}

type GradeComponentWithScore struct {
	ID     int      `json:"id"`
	Name   string   `json:"name"`
	Weight float64  `json:"weight"`
	Score  *float64 `json:"score"`
}

type IPKData struct {
	CourseID   int                       `json:"course_id"`
	CourseCode string                    `json:"course_code"`
	CourseName string                    `json:"course_name"`
	SKS        int                       `json:"sks"`
	CawuID     int                       `json:"cawu_id"`
	Components []GradeComponentWithScore `json:"components"`
}

// Legacy types for backward compatibility
type IPKEntry struct {
	CourseID   int     `json:"course_id"`
	CourseCode string  `json:"course_code"`
	CourseName string  `json:"course_name"`
	SKS        int     `json:"sks"`
	Grade      *string `json:"grade"`
}

type IPKCawu struct {
	Cawu    int        `json:"cawu"`
	Entries []IPKEntry `json:"entries"`
}

type UpdateGradeRequest struct {
	Cawu     int     `json:"cawu"`
	CourseID int     `json:"course_id"`
	Grade    *string `json:"grade"`
}
