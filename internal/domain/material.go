package domain

import "time"

type Material struct {
	ID          int      `json:"id"`
	SessionID   int      `json:"session_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Type        string   `json:"type"`
	URL         string   `json:"url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MaterialRepository interface {
	Create(material *Material) error
	GetBySessionID(sessionID int) ([]Material, error)
	GetByCourseID(courseID int) ([]SessionWithMaterials, error)
	GetByID(id int) (*Material, error)
	Update(material *Material) error
	Delete(id int) error
}
