package usecase

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type FonnteService struct {
	token  string
	baseURL string
	client *http.Client
}

func NewFonnteService(token string) *FonnteService {
	return &FonnteService{
		token:   token,
		baseURL: "https://api.fonnte.com/send",
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *FonnteService) Send(phone, message string) error {
	payload := map[string]string{
		"target":  phone,
		"message": message,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("fonnte marshal: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("fonnte request: %w", err)
	}

	req.Header.Set("Authorization", s.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("fonnte send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fonnte status: %d", resp.StatusCode)
	}

	return nil
}

func (s *FonnteService) SendTaskReminder(phone, taskName, deadline string) error {
	message := fmt.Sprintf(
		"📚 *MRT Academic - Reminder*\n\n"+
			"Tugas: %s\n"+
			"Deadline: %s\n\n"+
			"Segera kerjakan sebelum terlambat!",
		taskName,
		deadline,
	)
	return s.Send(phone, message)
}

func (s *FonnteService) SendTaskOverdue(phone, taskName string) error {
	message := fmt.Sprintf(
		"🚨 *MRT Academic - Tugas Terlambat!*\n\n"+
			"Tugas: %s\n"+
			"Sudah melewati deadline.\n\n"+
			"Segera hubungi dosen pengampu.",
		taskName,
	)
	return s.Send(phone, message)
}
