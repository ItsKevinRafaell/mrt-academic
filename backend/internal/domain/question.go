package domain

import (
	"time"
)

type QuestionType string

const (
	QuestionTypeRegular QuestionType = "regular"
	QuestionTypeExam    QuestionType = "exam"
)

type DifficultyLevel string

const (
	DifficultyEasy   DifficultyLevel = "easy"
	DifficultyMedium DifficultyLevel = "medium"
	DifficultyHard   DifficultyLevel = "hard"
)

type Question struct {
	ID              int              `json:"id"`
	CourseID        int              `json:"course_id"`
	SessionID       *int             `json:"session_id,omitempty"`
	Title           string           `json:"title"`
	QuestionText    string           `json:"question_text"`
	Type            QuestionType     `json:"type"`
	Options         []QuestionOption `json:"options,omitempty"`
	AnswerKey       *string          `json:"answer_key,omitempty"`
	DifficultyLevel DifficultyLevel  `json:"difficulty_level"`
	TimeLimitMin    *int             `json:"time_limit_minutes,omitempty"`
	ExternalURL     *string          `json:"external_url,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

type QuestionOption struct {
	ID         int    `json:"id"`
	QuestionID int    `json:"question_id"`
	OptionKey  string `json:"key"`
	Text       string `json:"text"`
}

type ExamSubmission struct {
	ID              int              `json:"id"`
	UserID          string           `json:"user_id"`
	QuestionID      int              `json:"question_id"`
	Answers         []SubmittedAnswer `json:"answers"`
	Score           *int             `json:"score,omitempty"`
	TimeSpentSec    int              `json:"time_spent_seconds"`
	SubmittedAt     time.Time        `json:"submitted_at"`
}

type SubmittedAnswer struct {
	OptionKey  string `json:"option_key"`
	IsSelected bool   `json:"selected"`
}

type QuestionRepository interface {
	Create(question *Question) error
	GetByID(id int) (*Question, error)
	GetByCourseID(courseID int) ([]*Question, error)
	GetBySessionID(sessionID int) ([]*Question, error)
	Update(question *Question) error
	Delete(id int) error
}

type ExamSubmissionRepository interface {
	Create(submission *ExamSubmission) error
	GetByUserID(userID string) ([]*ExamSubmission, error)
	GetByQuestionID(questionID int) ([]*ExamSubmission, error)
}

type QuestionUseCase interface {
	Create(question *Question) error
	GetByID(id int) (*Question, error)
	GetByCourseID(courseID int) ([]*Question, error)
	GetBySessionID(sessionID int) ([]*Question, error)
	Update(question *Question) error
	Delete(id int) error
	SubmitExam(submission *ExamSubmission) error
	GetSubmissionsByUser(userID string) ([]*ExamSubmission, error)
	GetSubmissionsByQuestion(questionID int) ([]*ExamSubmission, error)
}
