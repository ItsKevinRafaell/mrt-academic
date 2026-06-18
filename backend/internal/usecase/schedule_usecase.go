package usecase

import (
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type ScheduleUsecase struct {
	scheduleRepo domain.ScheduleRepository
	courseRepo   domain.CourseRepository
}

func NewScheduleUsecase(scheduleRepo domain.ScheduleRepository, courseRepo domain.CourseRepository) *ScheduleUsecase {
	return &ScheduleUsecase{
		scheduleRepo: scheduleRepo,
		courseRepo:   courseRepo,
	}
}

func (u *ScheduleUsecase) Create(courseID, dayOfWeek int, startTime, endTime string, sessionID *int) (*domain.Schedule, error) {
	if dayOfWeek < 0 || dayOfWeek > 6 {
		return nil, fmt.Errorf("day_of_week must be between 0 and 6")
	}

	if startTime >= endTime {
		return nil, fmt.Errorf("start_time must be before end_time")
	}

	_, err := u.courseRepo.GetByID(courseID)
	if err != nil {
		return nil, fmt.Errorf("course not found: %w", err)
	}

	s := &domain.Schedule{
		CourseID:  courseID,
		DayOfWeek: dayOfWeek,
		StartTime: startTime,
		EndTime:   endTime,
		SessionID: sessionID,
	}

	err = u.scheduleRepo.Create(s)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (u *ScheduleUsecase) GetAll() ([]domain.ScheduleWithCourse, error) {
	return u.scheduleRepo.GetAll()
}

func (u *ScheduleUsecase) GetByCourseID(courseID int) ([]domain.Schedule, error) {
	return u.scheduleRepo.GetByCourseID(courseID)
}

func (u *ScheduleUsecase) GetByID(id int) (*domain.ScheduleWithCourse, error) {
	return u.scheduleRepo.GetByID(id)
}

func (u *ScheduleUsecase) GetActive() ([]domain.ScheduleWithCourse, error) {
	now := time.Now().UTC()
	wib := now.Add(7 * time.Hour)

	dayOfWeek := int(wib.Weekday())
	currentTime := wib.Format("15:04:05")

	return u.scheduleRepo.GetActive(dayOfWeek, currentTime)
}

func (u *ScheduleUsecase) Update(id, courseID, dayOfWeek int, startTime, endTime string, sessionID *int) error {
	if dayOfWeek < 0 || dayOfWeek > 6 {
		return fmt.Errorf("day_of_week must be between 0 and 6")
	}

	if startTime >= endTime {
		return fmt.Errorf("start_time must be before end_time")
	}

	_, err := u.courseRepo.GetByID(courseID)
	if err != nil {
		return fmt.Errorf("course not found: %w", err)
	}

	existing, err := u.scheduleRepo.GetByID(id)
	if err != nil {
		return err
	}

	s := &domain.Schedule{
		ID:        existing.ID,
		CourseID:  courseID,
		DayOfWeek: dayOfWeek,
		StartTime: startTime,
		EndTime:   endTime,
		SessionID: sessionID,
		CreatedAt: existing.CreatedAt,
	}

	return u.scheduleRepo.Update(s)
}

func (u *ScheduleUsecase) Delete(id int) error {
	return u.scheduleRepo.Delete(id)
}
