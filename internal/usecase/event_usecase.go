package usecase

import (
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
	"time"
)

type EventUsecase struct {
	eventRepo *postgres.EventRepo
}

func NewEventUsecase(eventRepo *postgres.EventRepo) *EventUsecase {
	return &EventUsecase{eventRepo: eventRepo}
}

func (u *EventUsecase) CreateEvent(title, description, eventType string, eventDate time.Time) (*domain.AcademicEvent, error) {
	e := &domain.AcademicEvent{
		Title:       title,
		Description: description,
		EventDate:   eventDate,
		EventType:   eventType,
	}
	err := u.eventRepo.Create(e)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (u *EventUsecase) GetAllEvents() ([]domain.AcademicEvent, error) {
	return u.eventRepo.GetAll()
}

func (u *EventUsecase) GetUpcomingEvents() ([]domain.AcademicEvent, error) {
	return u.eventRepo.GetUpcoming()
}

func (u *EventUsecase) GetEvent(id int) (*domain.AcademicEvent, error) {
	return u.eventRepo.GetByID(id)
}

func (u *EventUsecase) UpdateEvent(id int, title, description, eventType string, eventDate time.Time) error {
	e := &domain.AcademicEvent{
		ID:          id,
		Title:       title,
		Description: description,
		EventDate:   eventDate,
		EventType:   eventType,
	}
	return u.eventRepo.Update(e)
}

func (u *EventUsecase) DeleteEvent(id int) error {
	return u.eventRepo.Delete(id)
}
