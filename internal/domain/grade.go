package domain

import "time"

type Grade struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	CourseID  int       `json:"course_id"`
	Grade     string    `json:"grade"`
	Course    Course    `json:"course,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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
