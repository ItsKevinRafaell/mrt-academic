package usecase

import (
	"context"
	"fmt"
	"mrt-backend/internal/domain"
	"time"
)

type BoardGalleryUsecase struct {
	boardGalleryRepo domain.BoardGalleryRepository
}

func NewBoardGalleryUsecase(repo domain.BoardGalleryRepository) *BoardGalleryUsecase {
	return &BoardGalleryUsecase{
		boardGalleryRepo: repo,
	}
}

func (uc *BoardGalleryUsecase) CreateItem(ctx context.Context, item *domain.BoardGallery) error {
	if item.SessionID == 0 {
		return fmt.Errorf("session_id is required")
	}
	if item.UploadedBy == "" {
		return fmt.Errorf("uploaded_by is required")
	}
	if item.Title == "" {
		return fmt.Errorf("title is required")
	}
	if item.ImageURL == "" {
		return fmt.Errorf("image_url is required")
	}

	// Set defaults
	if item.Tags == nil {
		item.Tags = []string{}
	}
	if item.OrderNumber == 0 {
		item.OrderNumber = int(time.Now().Unix())
	}
	item.IsActive = true

	return uc.boardGalleryRepo.Create(item)
}

func (uc *BoardGalleryUsecase) GetBySessionID(ctx context.Context, sessionID int) ([]domain.BoardGallery, error) {
	if sessionID == 0 {
		return nil, fmt.Errorf("session_id is required")
	}

	items, err := uc.boardGalleryRepo.GetBySessionID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get board gallery items: %w", err)
	}

	if items == nil {
		items = []domain.BoardGallery{}
	}

	return items, nil
}

func (uc *BoardGalleryUsecase) GetByTopicID(ctx context.Context, topicID int) ([]domain.BoardGallery, error) {
	if topicID == 0 {
		return nil, fmt.Errorf("topic_id is required")
	}

	items, err := uc.boardGalleryRepo.GetByTopicID(topicID)
	if err != nil {
		return nil, fmt.Errorf("failed to get board gallery items: %w", err)
	}

	if items == nil {
		items = []domain.BoardGallery{}
	}

	return items, nil
}

func (uc *BoardGalleryUsecase) GetByID(ctx context.Context, id int) (*domain.BoardGallery, error) {
	if id == 0 {
		return nil, fmt.Errorf("id is required")
	}

	item, err := uc.boardGalleryRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get board gallery item: %w", err)
	}

	if item == nil {
		return nil, fmt.Errorf("board gallery item not found")
	}

	return item, nil
}

func (uc *BoardGalleryUsecase) UpdateItem(ctx context.Context, item *domain.BoardGallery) error {
	if item.ID == 0 {
		return fmt.Errorf("id is required")
	}

	// Get existing item to validate it exists
	existing, err := uc.boardGalleryRepo.GetByID(item.ID)
	if err != nil {
		return fmt.Errorf("failed to get existing item: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("board gallery item not found")
	}

	// Update only provided fields
	if item.Title != "" {
		existing.Title = item.Title
	}
	if item.Description != "" {
		existing.Description = item.Description
	}
	if item.ImageURL != "" {
		existing.ImageURL = item.ImageURL
	}
	if item.OCRText != "" {
		existing.OCRText = item.OCRText
	}
	if item.Tags != nil {
		existing.Tags = item.Tags
	}
	if item.OrderNumber != 0 {
		existing.OrderNumber = item.OrderNumber
	}

	return uc.boardGalleryRepo.Update(existing)
}

func (uc *BoardGalleryUsecase) DeleteItem(ctx context.Context, id int) error {
	if id == 0 {
		return fmt.Errorf("id is required")
	}

	// Check if item exists
	existing, err := uc.boardGalleryRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("failed to get existing item: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("board gallery item not found")
	}

	return uc.boardGalleryRepo.Delete(id)
}

func (uc *BoardGalleryUsecase) ReorderItems(ctx context.Context, id int, orderNumber int) error {
	if id == 0 {
		return fmt.Errorf("id is required")
	}

	return uc.boardGalleryRepo.Reorder(id, orderNumber)
}
