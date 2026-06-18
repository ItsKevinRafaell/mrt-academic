package domain

import (
	"context"
	"time"
)

// ExamArchive represents an archived exam paper
type ExamArchive struct {
	ID          int       `json:"id" db:"id"`
	CourseID    int       `json:"course_id" db:"course_id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	ExamType    string    `json:"exam_type" db:"exam_type"`
	Year        int       `json:"year" db:"year"`
	FileURL     string    `json:"file_url" db:"file_url"`
	FileType    string    `json:"file_type" db:"file_type"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateExamArchiveRequest represents the request to create an exam archive
type CreateExamArchiveRequest struct {
	CourseID    int    `json:"course_id" validate:"required"`
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	ExamType    string `json:"exam_type" validate:"required,oneof=uts uas kuis tryout"`
	Year        int    `json:"year" validate:"required,min=2000,max=2100"`
	FileURL     string `json:"file_url" validate:"required"`
	FileType    string `json:"file_type" validate:"omitempty,oneof=pdf doc docx"`
}

// UpdateExamArchiveRequest represents the request to update an exam archive
type UpdateExamArchiveRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	ExamType    string `json:"exam_type" validate:"omitempty,oneof=uts uas kuis tryout"`
	Year        int    `json:"year" validate:"omitempty,min=2000,max=2100"`
	FileURL     string `json:"file_url"`
	FileType    string `json:"file_type" validate:"omitempty,oneof=pdf doc docx"`
}

// ExamArchiveRepository defines the interface for exam archive operations
type ExamArchiveRepository interface {
	Create(ctx context.Context, archive *ExamArchive) error
	GetAll(ctx context.Context, courseID int) ([]ExamArchive, error)
	GetByID(ctx context.Context, id int) (*ExamArchive, error)
	Update(ctx context.Context, archive *ExamArchive) error
	Delete(ctx context.Context, id int) error
}
