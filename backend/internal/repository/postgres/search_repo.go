package postgres

import (
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
	"strings"
	"time"
)

type SearchRepo struct {
	db    *sql.DB
	cache *domain.SearchCache
}

func NewSearchRepo(db *sql.DB) *SearchRepo {
	return &SearchRepo{
		db:    db,
		cache: &domain.SearchCache{},
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
	return r.cache
}

func (r *SearchRepo) GetIndex() (*domain.SearchIndex, error) {
	if r.cache.Data == nil {
		if err := r.RebuildCache(); err != nil {
			return nil, err
		}
	}
	return r.cache.Data, nil
}

func (r *SearchRepo) Search(query string) (*domain.SearchIndex, error) {
	if r.cache.Data == nil {
		if err := r.RebuildCache(); err != nil {
			return nil, err
		}
	}

	queryLower := strings.ToLower(query)
	result := &domain.SearchIndex{
		Courses:  []domain.SearchItem{},
		Sessions: []domain.SearchItem{},
		Tasks:    []domain.SearchItem{},
	}

	for _, item := range r.cache.Data.Courses {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Courses = append(result.Courses, item)
		}
	}

	for _, item := range r.cache.Data.Sessions {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Sessions = append(result.Sessions, item)
		}
	}

	for _, item := range r.cache.Data.Tasks {
		if strings.Contains(strings.ToLower(item.Title), queryLower) {
			result.Tasks = append(result.Tasks, item)
		}
	}

	return result, nil
}
