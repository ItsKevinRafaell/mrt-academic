package usecase

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type StorageService interface {
	Upload(file multipart.File, header *multipart.FileHeader, folder string) (string, error)
	Delete(url string) error
}

type LocalStorage struct {
	baseDir string
}

func NewLocalStorage(baseDir string) *LocalStorage {
	os.MkdirAll(baseDir, 0755)
	return &LocalStorage{baseDir: baseDir}
}

func (s *LocalStorage) Upload(file multipart.File, header *multipart.FileHeader, folder string) (string, error) {
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}

	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	dir := filepath.Join(s.baseDir, folder)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create dir: %w", err)
	}

	dst, err := os.Create(filepath.Join(dir, filename))
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("copy file: %w", err)
	}

	return fmt.Sprintf("/uploads/%s/%s", folder, filename), nil
}

func (s *LocalStorage) Delete(url string) error {
	path := filepath.Join(s.baseDir, url)
	return os.Remove(path)
}
