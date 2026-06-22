package usecase

import (
	"mrt-backend/internal/domain"
	"time"
)

type SearchUsecase struct {
	searchRepo domain.SearchRepository
	cacheTTL   time.Duration
}

func NewSearchUsecase(searchRepo domain.SearchRepository, cacheTTL time.Duration) *SearchUsecase {
	return &SearchUsecase{
		searchRepo: searchRepo,
		cacheTTL:   cacheTTL,
	}
}

func (u *SearchUsecase) GetIndex() (*domain.SearchIndex, error) {
	return u.searchRepo.GetIndex()
}

func (u *SearchUsecase) Search(query string) (*domain.SearchIndex, error) {
	return u.searchRepo.Search(query)
}
