package domain

import "time"

type PresentationMode string

const (
	PresentationModeNomorUrut PresentationMode = "nomor_urut"
	PresentationModePrioritas PresentationMode = "prioritas"
)

type PresentationConfig struct {
	ID             int             `json:"id"`
	CourseID       int             `json:"course_id"`
	Mode           PresentationMode `json:"mode"`
	PriorityLimit  int             `json:"priority_limit"`
	StartNomorUrut int            `json:"start_nomor_urut"`
	NextNomorUrut  int             `json:"next_nomor_urut"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type PriorityStudent struct {
	ID            int       `json:"id"`
	CourseID      int       `json:"course_id"`
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name,omitempty"`
	NomorUrut     int       `json:"nomor_urut,omitempty"`
	PriorityOrder int       `json:"priority_order"`
	CreatedAt     time.Time `json:"created_at"`
}

type PresentationRecord struct {
	ID          int       `json:"id"`
	CourseID    int       `json:"course_id"`
	UserID      string    `json:"user_id"`
	UserName    string    `json:"user_name,omitempty"`
	NomorUrut   int       `json:"nomor_urut,omitempty"`
	PresentedAt time.Time `json:"presented_at"`
	Topic       string    `json:"topic,omitempty"`
	Points      int       `json:"points"`
	ApprovedBy  *string   `json:"approved_by,omitempty"`
	ApprovedAt  *time.Time `json:"approved_at,omitempty"`
}

type PendingPresentation struct {
	ID          int       `json:"id"`
	CourseID    int       `json:"course_id"`
	UserID      string    `json:"user_id"`
	UserName    string    `json:"user_name,omitempty"`
	NomorUrut   int       `json:"nomor_urut,omitempty"`
	RequestedAt time.Time `json:"requested_at"`
	Topic       string    `json:"topic,omitempty"`
	Points      int       `json:"points"`
}

type LeaderboardEntry struct {
	UserID      string `json:"user_id"`
	UserName    string `json:"user_name"`
	NomorUrut   int    `json:"nomor_urut"`
	TotalPoints int    `json:"total_points"`
	TotalShows  int     `json:"total_shows"`
}

type PresentationRepository interface {
	GetOrCreateConfig(courseID int) (*PresentationConfig, error)
	UpdateConfig(config *PresentationConfig) error
	GetPriorityStudents(courseID int) ([]PriorityStudent, error)
	AddPriorityStudent(courseID int, userID string, order int) error
	RemovePriorityStudent(courseID int, userID string) error
	ReorderPriorityStudents(courseID int, userIDs []string) error
	RecordPresentation(courseID int, userID string, topic string, points int) error
	GetStudentHistory(courseID int, userID string) ([]PresentationRecord, error)
	GetLeaderboard(courseID int) ([]LeaderboardEntry, error)
	GetNextByNomorUrut(courseID int) (*PriorityStudent, error)
	GetNextByPriority(courseID int) (*PriorityStudent, error)
	GetAllStudents() ([]PriorityStudent, error)
	// Pending presentation workflow
	CreatePendingPresentation(courseID int, userID string, topic string, points int) error
	GetPendingPresentations(courseID int) ([]PendingPresentation, error)
	ApprovePresentation(id int, approverID string) error
	RejectPresentation(id int) error
}
