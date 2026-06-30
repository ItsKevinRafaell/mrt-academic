package usecase

import (
	"fmt"
	"io"
	"mime/multipart"
	"mrt-backend/internal/domain"
)

type TaskPhotoUsecase struct {
	photoRepo domain.TaskPhotoRepository
	storage   StorageService
}

func NewTaskPhotoUsecase(photoRepo domain.TaskPhotoRepository, storage StorageService) *TaskPhotoUsecase {
	return &TaskPhotoUsecase{
		photoRepo: photoRepo,
		storage:   storage,
	}
}

func (u *TaskPhotoUsecase) AddPhoto(taskID int, file multipart.File, header *multipart.FileHeader, caption string, userID string) (*domain.TaskPhoto, error) {
	if file == nil {
		return nil, fmt.Errorf("file required")
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		contentType = "application/octet-stream"
	}

	maxSize := int64(5 * 1024 * 1024)
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size exceeds 5MB limit")
	}

	url, err := u.storage.Upload(file, header, "tasks")
	if err != nil {
		return nil, fmt.Errorf("upload failed: %w", err)
	}

	photo := &domain.TaskPhoto{
		TaskID:   taskID,
		ImageURL: url,
		Caption:  caption,
	}

	if userID != "" {
		photo.CreatedBy = userID
	}

	if err := u.photoRepo.Create(photo); err != nil {
		u.storage.Delete(url)
		return nil, fmt.Errorf("save photo: %w", err)
	}

	return photo, nil
}

func (u *TaskPhotoUsecase) GetPhotos(taskID int) ([]domain.TaskPhoto, error) {
	photos, err := u.photoRepo.GetByTaskID(taskID)
	if err != nil {
		return nil, err
	}
	if photos == nil {
		return []domain.TaskPhoto{}, nil
	}
	return photos, nil
}

func (u *TaskPhotoUsecase) DeletePhoto(photoID int) error {
	photos, err := u.photoRepo.GetByTaskID(0)
	if err != nil {
		return err
	}

	var photo domain.TaskPhoto
	found := false
	for _, p := range photos {
		if p.ID == photoID {
			photo = p
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("photo not found")
	}

	if err := u.photoRepo.Delete(photoID); err != nil {
		return err
	}

	u.storage.Delete(photo.ImageURL)
	return nil
}

func copyHeader(src io.Reader, dst io.Writer) (int64, error) {
	buf := make([]byte, 32*1024)
	return io.CopyBuffer(dst, src, buf)
}
