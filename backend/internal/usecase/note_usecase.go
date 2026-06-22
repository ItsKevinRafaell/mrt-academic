package usecase

import (
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type NoteUsecase struct {
	repo domain.NoteRepository
}

func NewNoteUsecase(repo domain.NoteRepository) *NoteUsecase {
	return &NoteUsecase{repo: repo}
}

func (uc *NoteUsecase) CreateNote(userID, title, content string, courseID, sessionID *int, tags []string) (*domain.Note, error) {
	if title == "" {
		title = "Catatan Baru"
	}
	if tags == nil {
		tags = []string{}
	}
	now := time.Now().Format(time.RFC3339)
	note := &domain.Note{
		ID:        fmt.Sprintf("note-%d-%d", time.Now().UnixMilli(), time.Now().UnixNano()),
		UserID:    userID,
		Title:     title,
		Content:   content,
		CourseID:  courseID,
		SessionID: sessionID,
		Tags:      tags,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := uc.repo.CreateNote(note); err != nil {
		return nil, err
	}
	return note, nil
}

func (uc *NoteUsecase) GetAllNotes(userID string) ([]domain.Note, error) {
	return uc.repo.GetNotesByUser(userID)
}

func (uc *NoteUsecase) GetNotesBySession(userID string, sessionID int) ([]domain.Note, error) {
	return uc.repo.GetNotesBySession(userID, sessionID)
}

func (uc *NoteUsecase) UpdateNote(userID, id, title, content string, tags []string) (*domain.Note, error) {
	existing, err := uc.repo.GetNoteByID(id)
	if err != nil {
		return nil, err
	}
	if existing.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}
	existing.Title = title
	existing.Content = content
	existing.Tags = tags
	existing.UpdatedAt = time.Now().Format(time.RFC3339)
	if err := uc.repo.UpdateNote(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (uc *NoteUsecase) DeleteNote(userID, id string) error {
	return uc.repo.DeleteNote(id, userID)
}
