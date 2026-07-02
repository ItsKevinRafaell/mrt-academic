package usecase

import (
	"fmt"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
)

type PresentationUsecase struct {
	repo           domain.PresentationRepository
	notificationRepo *postgres.NotificationRepo
}

func NewPresentationUsecase(repo domain.PresentationRepository, notifRepo *postgres.NotificationRepo) *PresentationUsecase {
	return &PresentationUsecase{repo: repo, notificationRepo: notifRepo}
}

func (u *PresentationUsecase) GetOrCreateConfig(courseID int) (*domain.PresentationConfig, error) {
	return u.repo.GetOrCreateConfig(courseID)
}

func (u *PresentationUsecase) UpdateConfig(courseID int, mode domain.PresentationMode, priorityLimit int, startNomorUrut int) error {
	config, err := u.repo.GetOrCreateConfig(courseID)
	if err != nil {
		return err
	}
	config.Mode = mode
	config.PriorityLimit = priorityLimit
	config.StartNomorUrut = startNomorUrut
	return u.repo.UpdateConfig(config)
}

func (u *PresentationUsecase) GetPriorityStudents(courseID int) ([]domain.PriorityStudent, error) {
	return u.repo.GetPriorityStudents(courseID)
}

func (u *PresentationUsecase) AddToPriority(courseID int, userID string) error {
	students, err := u.repo.GetPriorityStudents(courseID)
	if err != nil {
		return err
	}
	if len(students) >= 5 {
		return fmt.Errorf("priority limit reached (max 5)")
	}
	order := len(students)
	err = u.repo.AddPriorityStudent(courseID, userID, order)
	if err != nil {
		return err
	}

	// Send notification to student
	position := order + 1
	u.notificationRepo.Create(
		userID,
		"Giliran Presentasi",
		fmt.Sprintf("Kamu mendapat giliran presentasi di posisi #%d. Siapkan materimu!", position),
		"presentation",
		fmt.Sprintf("/akademik/%d?tab=poin", courseID),
	)

	return nil
}

func (u *PresentationUsecase) RemoveFromPriority(courseID int, userID string) error {
	return u.repo.RemovePriorityStudent(courseID, userID)
}

func (u *PresentationUsecase) ReorderPriority(courseID int, userIDs []string) error {
	return u.repo.ReorderPriorityStudents(courseID, userIDs)
}

func (u *PresentationUsecase) GetNextPresenter(courseID int) (*domain.PriorityStudent, error) {
	config, err := u.repo.GetOrCreateConfig(courseID)
	if err != nil {
		return nil, err
	}

	if config.Mode == domain.PresentationModePrioritas {
		return u.repo.GetNextByPriority(courseID)
	}
	return u.repo.GetNextByNomorUrut(courseID)
}

func (u *PresentationUsecase) RecordPresentation(courseID int, userID string, topic string, points int) error {
	return u.repo.RecordPresentation(courseID, userID, topic, points)
}

func (u *PresentationUsecase) GetStudentRecord(courseID int, userID string) ([]domain.PresentationRecord, error) {
	return u.repo.GetStudentHistory(courseID, userID)
}

func (u *PresentationUsecase) GetLeaderboard(courseID int) ([]domain.LeaderboardEntry, error) {
	return u.repo.GetLeaderboard(courseID)
}

func (u *PresentationUsecase) GetAllStudents() ([]domain.PriorityStudent, error) {
	return u.repo.GetAllStudents()
}

func (u *PresentationUsecase) GetPendingPresentations(courseID int) ([]domain.PendingPresentation, error) {
	return u.repo.GetPendingPresentations(courseID)
}

func (u *PresentationUsecase) CreatePendingPresentation(courseID int, userID string, topic string, points int) error {
	return u.repo.CreatePendingPresentation(courseID, userID, topic, points)
}

func (u *PresentationUsecase) ApprovePresentation(id int, approverID string) error {
	return u.repo.ApprovePresentation(id, approverID)
}

func (u *PresentationUsecase) RejectPresentation(id int) error {
	return u.repo.RejectPresentation(id)
}
