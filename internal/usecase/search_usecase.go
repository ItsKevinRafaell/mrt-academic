package usecase

import (
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
	"time"
)

type SearchUsecase struct {
	searchRepo *postgres.SearchRepo
	cacheTTL   time.Duration
}

func NewSearchUsecase(searchRepo *postgres.SearchRepo, cacheTTL time.Duration) *SearchUsecase {
	return &SearchUsecase{
		searchRepo: searchRepo,
		cacheTTL:   cacheTTL,
	}
}

func (u *SearchUsecase) GetIndex() (*domain.SearchIndex, error) {
	cache := u.searchRepo.GetCache()

	if cache.Data == nil || time.Since(cache.LastUpdated) > u.cacheTTL {
		if err := u.searchRepo.RebuildCache(); err != nil {
			return nil, err
		}
		cache = u.searchRepo.GetCache()
	}

	return cache.Data, nil
}

func (u *SearchUsecase) Search(query string) (*domain.SearchIndex, error) {
	return u.searchRepo.Search(query)
}
