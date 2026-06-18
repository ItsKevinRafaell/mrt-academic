package domain

import "time"

// Cawu represents an academic term/semester
type Cawu struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Year      int       `json:"year"`
	Semester  int       `json:"semester"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SystemSettings represents key-value configuration storage
type SystemSettings struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CawuRepository defines the interface for cawu data operations
type CawuRepository interface {
	Create(cawu *Cawu) error
	GetAll() ([]Cawu, error)
	GetByID(id int) (*Cawu, error)
	GetActive() (*Cawu, error)
	SetActive(id int) error
	Update(cawu *Cawu) error
	Delete(id int) error
}

// SystemSettingsRepository defines the interface for system settings operations
type SystemSettingsRepository interface {
	Get(key string) (string, error)
	Set(key, value string) error
	Delete(key string) error
}
