package usecase

import (
	"log"
	"mrt-backend/internal/domain"
	"time"
)

type SearchUsecase struct {
	searchRepo domain.SearchRepository
	cacheTTL   time.Duration
	stopCh     chan struct{}
}

func NewSearchUsecase(searchRepo domain.SearchRepository, cacheTTL time.Duration) *SearchUsecase {
	su := &SearchUsecase{
		searchRepo: searchRepo,
		cacheTTL:   cacheTTL,
		stopCh:     make(chan struct{}),
	}
	go su.periodicCacheRebuild()
	return su
}

func (u *SearchUsecase) periodicCacheRebuild() {
	ticker := time.NewTicker(u.cacheTTL)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := u.searchRepo.RebuildCache(); err != nil {
				log.Printf("search cache rebuild failed: %v", err)
			}
		case <-u.stopCh:
			return
		}
	}
}

func (u *SearchUsecase) Stop() {
	close(u.stopCh)
}

func (u *SearchUsecase) GetIndex() (*domain.SearchIndex, error) {
	return u.searchRepo.GetIndex()
}

func (u *SearchUsecase) Search(query string) (*domain.SearchIndex, error) {
	return u.searchRepo.Search(query)
}

func (u *SearchUsecase) InvalidateCache() error {
	return u.searchRepo.RebuildCache()
}
