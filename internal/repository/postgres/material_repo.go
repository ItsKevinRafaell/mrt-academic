package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
)

type MaterialRepo struct {
	db *sql.DB
}

func NewMaterialRepo(db *sql.DB) *MaterialRepo {
	return &MaterialRepo{db: db}
}

func (r *MaterialRepo) Create(m *domain.Material) error {
	query := `INSERT INTO materials (session_id, title, description, type, url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(query, m.SessionID, m.Title, m.Description, m.Type, m.URL).
		Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt)
}

func (r *MaterialRepo) GetBySessionID(sessionID int) ([]domain.Material, error) {
	query := `SELECT id, session_id, title, description, type, url, created_at, updated_at
		FROM materials WHERE session_id = $1 ORDER BY created_at`

	rows, err := r.db.Query(query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var materials []domain.Material
	for rows.Next() {
		var m domain.Material
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Title, &m.Description,
			&m.Type, &m.URL, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		materials = append(materials, m)
	}
	return materials, rows.Err()
}

func (r *MaterialRepo) GetByCourseID(courseID int) ([]domain.SessionWithMaterials, error) {
	query := `SELECT s.id, s.course_id, s.number, s.title, s.description, s.created_at, s.updated_at,
		m.id, m.title, m.description, m.type, m.url, m.created_at, m.updated_at
		FROM sessions s
		LEFT JOIN materials m ON m.session_id = s.id
		WHERE s.course_id = $1
		ORDER BY s.number, m.created_at`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessionMap := make(map[int]*domain.SessionWithMaterials)
	var order []int

	for rows.Next() {
		var s domain.Session
		var mID sql.NullInt64
		var mTitle, mDesc, mType, mURL sql.NullString
		var mCreatedAt, mUpdatedAt sql.NullTime

		if err := rows.Scan(&s.ID, &s.CourseID, &s.Number, &s.Title,
			&s.Description, &s.CreatedAt, &s.UpdatedAt,
			&mID, &mTitle, &mDesc, &mType, &mURL, &mCreatedAt, &mUpdatedAt); err != nil {
			return nil, err
		}

		swm, exists := sessionMap[s.ID]
		if !exists {
			swm = &domain.SessionWithMaterials{Session: s}
			sessionMap[s.ID] = swm
			order = append(order, s.ID)
		}

		if mID.Valid {
			swm.Materials = append(swm.Materials, domain.Material{
				ID:          int(mID.Int64),
				SessionID:   s.ID,
				Title:       mTitle.String,
				Description: mDesc.String,
				Type:        mType.String,
				URL:         mURL.String,
				CreatedAt:   mCreatedAt.Time,
				UpdatedAt:   mUpdatedAt.Time,
			})
		}
	}

	var result []domain.SessionWithMaterials
	for _, id := range order {
		result = append(result, *sessionMap[id])
	}
	return result, rows.Err()
}

func (r *MaterialRepo) GetByID(id int) (*domain.Material, error) {
	m := &domain.Material{}
	query := `SELECT id, session_id, title, description, type, url, created_at, updated_at
		FROM materials WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&m.ID, &m.SessionID, &m.Title, &m.Description,
		&m.Type, &m.URL, &m.CreatedAt, &m.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return m, err
}

func (r *MaterialRepo) Update(m *domain.Material) error {
	query := `UPDATE materials SET title = $1, description = $2, type = $3, url = $4, updated_at = NOW()
		WHERE id = $5 RETURNING updated_at`

	err := r.db.QueryRow(query, m.Title, m.Description, m.Type, m.URL, m.ID).
		Scan(&m.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	return err
}

func (r *MaterialRepo) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM materials WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
