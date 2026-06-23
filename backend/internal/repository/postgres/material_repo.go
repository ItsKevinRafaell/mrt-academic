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

func (r *MaterialRepo) GetByTopicID(topicID int) ([]domain.Material, error) {
	query := `SELECT m.id, COALESCE(m.session_id, 0), m.topic_id, m.title, m.description, m.type, m.url, m.created_at, m.updated_at
		FROM materials m
		WHERE m.topic_id = $1 OR m.session_id IN (SELECT session_id FROM topic_sessions WHERE topic_id = $1)
		ORDER BY m.created_at`

	rows, err := r.db.Query(query, topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var materials []domain.Material
	for rows.Next() {
		var m domain.Material
		var sessionID int64
		var topicIDNull sql.NullInt64
		if err := rows.Scan(&m.ID, &sessionID, &topicIDNull, &m.Title, &m.Description,
			&m.Type, &m.URL, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		sid := int(sessionID)
		if sid > 0 {
			m.SessionID = &sid
		}
		if topicIDNull.Valid {
			tid := int(topicIDNull.Int64)
			m.TopicID = &tid
		}
		materials = append(materials, m)
	}
	return materials, rows.Err()
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
			sessionID := s.ID
			swm.Materials = append(swm.Materials, domain.Material{
				ID:          int(mID.Int64),
				SessionID:   &sessionID,
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

func (r *MaterialRepo) GetByIDWithCourse(id int) (*domain.Material, *domain.Course, error) {
	query := `SELECT m.id, m.session_id, m.topic_id, m.title, m.description, m.type, m.url, m.created_at, m.updated_at,
		c.id, c.code, c.name, c.sks, c.description, c.course_type, c.cawu_id, c.created_at, c.updated_at
		FROM materials m
		LEFT JOIN sessions s ON s.id = m.session_id
		LEFT JOIN courses c ON c.id = COALESCE(s.course_id,
			(SELECT course_id FROM topics WHERE id = m.topic_id))
		WHERE m.id = $1`

	var m domain.Material
	var c domain.Course
	var sessionID, topicID, cawuID sql.NullInt64
	var cCode, cName, cDesc, cType sql.NullString
	var cSks sql.NullInt64
	var cCreated, cUpdated, mCreated, mUpdated sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&m.ID, &sessionID, &topicID, &m.Title, &m.Description,
		&m.Type, &m.URL, &mCreated, &mUpdated,
		&c.ID, &cCode, &cName, &cSks, &cDesc, &cType, &cawuID, &cCreated, &cUpdated,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, nil, err
	}

	if sessionID.Valid {
		sid := int(sessionID.Int64)
		m.SessionID = &sid
	}
	if topicID.Valid {
		tid := int(topicID.Int64)
		m.TopicID = &tid
	}
	if mCreated.Valid {
		m.CreatedAt = mCreated.Time
	}
	if mUpdated.Valid {
		m.UpdatedAt = mUpdated.Time
	}

	if c.ID != 0 {
		if cCode.Valid {
			c.Code = cCode.String
		}
		if cName.Valid {
			c.Name = cName.String
		}
		if cDesc.Valid {
			c.Description = cDesc.String
		}
		if cType.Valid {
			c.CourseType = cType.String
		}
		if cSks.Valid {
			c.SKS = int(cSks.Int64)
		}
		if cawuID.Valid {
			c.CawuID = domain.NullInt64{NullInt64: sql.NullInt64{Int64: cawuID.Int64, Valid: true}}
		}
		if cCreated.Valid {
			c.CreatedAt = cCreated.Time
		}
		if cUpdated.Valid {
			c.UpdatedAt = cUpdated.Time
		}
	}

	return &m, &c, nil
}
