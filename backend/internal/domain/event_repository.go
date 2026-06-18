package domain

type EventRepository interface {
	Create(event *AcademicEvent) error
	GetAll() ([]AcademicEvent, error)
	GetUpcoming() ([]AcademicEvent, error)
	GetByID(id int) (*AcademicEvent, error)
	Update(event *AcademicEvent) error
	Delete(id int) error
}
