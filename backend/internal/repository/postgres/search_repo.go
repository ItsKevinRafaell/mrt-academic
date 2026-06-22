package postgres

import (
	"database/sql"
	"fmt"
	"log"
	"mrt-backend/internal/domain"
	"strings"
	"sync"
	"time"
)

type SearchRepo struct {
	db    *sql.DB
	cache *domain.SearchCache
	ttl   time.Duration
	mu    sync.RWMutex
}

func NewSearchRepo(db *sql.DB, ttl time.Duration) *SearchRepo {
	repo := &SearchRepo{
		db:    db,
		cache: &domain.SearchCache{},
		ttl:   ttl,
	}
	go repo.periodicRebuild()
	return repo
}

func (r *SearchRepo) periodicRebuild() {
	if r.ttl <= 0 {
		r.ttl = 5 * time.Minute
	}
	for {
		if err := r.RebuildCache(); err != nil {
			log.Printf("search cache rebuild failed: %v", err)
		}
		time.Sleep(r.ttl)
	}
}

func (r *SearchRepo) RebuildCache() error {
	index := &domain.SearchIndex{
		Courses:  []domain.SearchItem{},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}

	courseQuery := `
		SELECT id, code, name, description
		FROM courses
		ORDER BY code
	`
	rows, err := r.db.Query(courseQuery)
	if err != nil {
		return err
	}
	for rows.Next() {
		var id int
		var code, name string
		var desc sql.NullString
		err := rows.Scan(&id, &code, &name, &desc)
		if err != nil {
			rows.Close()
			return err
		}
		index.Courses = append(index.Courses, domain.SearchItem{
			ID:          id,
			Type:        "course",
			Title:       code + " - " + name,
			Description: desc.String,
		})
	}
	rows.Close()

	sessionQuery := `
		SELECT s.id, s.number, s.title, c.code as course_code
		FROM sessions s
		JOIN courses c ON s.course_id = c.id
		ORDER BY c.code, s.number
	`
	sessRows, err := r.db.Query(sessionQuery)
	if err != nil {
		return err
	}
	for sessRows.Next() {
		var id, sessionNum int
		var title, courseCode string
		err := sessRows.Scan(&id, &sessionNum, &title, &courseCode)
		if err != nil {
			sessRows.Close()
			return err
		}
		index.Sessions = append(index.Sessions, domain.SearchItem{
			ID:          id,
			Type:        "session",
			Title:       fmt.Sprintf("%s - Session %d: %s", courseCode, sessionNum, title),
			Description: "",
		})
	}
	sessRows.Close()

	taskQuery := `
		SELECT t.id, t.title, t.deadline, c.code as course_code
		FROM tasks t
		JOIN courses c ON t.course_id = c.id
		ORDER BY t.deadline
	`
	taskRows, err := r.db.Query(taskQuery)
	if err != nil {
		return err
	}
	for taskRows.Next() {
		var id int
		var title, courseCode string
		var deadline time.Time
		err := taskRows.Scan(&id, &title, &deadline, &courseCode)
		if err != nil {
			taskRows.Close()
			return err
		}
		index.Tasks = append(index.Tasks, domain.SearchItem{
			ID:          id,
			Type:        "task",
			Title:       courseCode + " - " + title,
			Description: "Deadline: " + deadline.Format("2006-01-02"),
		})
	}
	taskRows.Close()

	r.cache.Data = index
	r.cache.LastUpdated = time.Now()
	return nil
}

func (r *SearchRepo) GetCache() *domain.SearchCache {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.cache
}

func (r *SearchRepo) InvalidateCache() {
	r.mu.Lock()
	r.cache.Data = nil
	r.mu.Unlock()
}

func (r *SearchRepo) GetIndex() (*domain.SearchIndex, error) {
	r.mu.RLock()
	if r.cache.Data != nil {
		data := r.cache.Data
		r.mu.RUnlock()
		return data, nil
	}
	r.mu.RUnlock()

	if err := r.RebuildCache(); err != nil {
		return nil, err
	}
	r.mu.RLock()
	data := r.cache.Data
	r.mu.RUnlock()
	return data, nil
}

func (r *SearchRepo) Search(query string) (*domain.SearchIndex, error) {
	r.mu.RLock()
	if r.cache.Data == nil {
		r.mu.RUnlock()
		if err := r.RebuildCache(); err != nil {
			return nil, err
		}
		r.mu.RLock()
	}
	cached := r.cache.Data
	r.mu.RUnlock()

	queryLower := strings.ToLower(query)
	result := &domain.SearchIndex{
		Courses:  []domain.SearchItem{},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}

	for _, item := range cached.Courses {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Courses = append(result.Courses, item)
		}
	}

	for _, item := range cached.Sessions {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Sessions = append(result.Sessions, item)
		}
	}

	for _, item := range cached.Tasks {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Tasks = append(result.Tasks, item)
		}
	}

	return result, nil
}
