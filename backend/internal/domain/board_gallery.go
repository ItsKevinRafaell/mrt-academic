package domain

import "time"

type BoardGallery struct {
	ID          int       `json:"id"`
	SessionID   int       `json:"session_id"`
	UploadedBy  string    `json:"uploaded_by"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	OCRText     string    `json:"ocr_text"`
	Tags        []string  `json:"tags"`
	OrderNumber int       `json:"order_number"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BoardGalleryRepository interface {
	Create(item *BoardGallery) error
	GetBySessionID(sessionID int) ([]BoardGallery, error)
	GetByTopicID(topicID int) ([]BoardGallery, error)
	GetByID(id int) (*BoardGallery, error)
	Update(item *BoardGallery) error
	Delete(id int) error
	Reorder(id int, orderNumber int) error
}
