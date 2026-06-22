package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
	"strings"
)

type MaterialRequestRepo struct {
	db *sql.DB
}

func NewMaterialRequestRepo(db *sql.DB) *MaterialRequestRepo {
	return &MaterialRequestRepo{db: db}
}

func (r *MaterialRequestRepo) Create(req *domain.MaterialRequest) error {
	query := `INSERT INTO material_requests (requesting_course_id, requested_by, purpose, material_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, requested_at, is_active`

	return r.db.QueryRow(query, req.RequestingCourseID, req.RequestedBy, req.Purpose, req.MaterialID).
		Scan(&req.ID, &req.RequestedAt, &req.IsActive)
}

func (r *MaterialRequestRepo) GetByID(id int) (*domain.MaterialRequest, error) {
	query := `SELECT id, requesting_course_id, requested_by, purpose, material_id,
		requested_at, reviewed_at, reviewed_by, status, review_note, is_active
		FROM material_requests WHERE id = $1 AND is_active = true`

	req := &domain.MaterialRequest{}
	var reviewedBy sql.NullString
	var reviewedAt sql.NullTime
	var reviewNote sql.NullString

	err := r.db.QueryRow(query, id).Scan(
		&req.ID, &req.RequestingCourseID, &req.RequestedBy, &req.Purpose, &req.MaterialID,
		&req.RequestedAt, &reviewedAt, &reviewedBy, &req.Status, &reviewNote, &req.IsActive,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if reviewedBy.Valid {
		req.ReviewedBy = &reviewedBy.String
	}
	if reviewedAt.Valid {
		req.ReviewedAt = &reviewedAt.Time
	}
	if reviewNote.Valid {
		req.ReviewNote = reviewNote.String
	}

	return req, nil
}

func (r *MaterialRequestRepo) List(filter domain.MaterialRequestFilter) ([]domain.MaterialRequestWithDetails, error) {
	conditions := []string{"mr.is_active = true"}
	args := []interface{}{}
	argIdx := 1

	if filter.Status != "" {
		conditions = append(conditions, "mr.status = $"+string(rune('0'+argIdx)))
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.RequestingCourseID > 0 {
		conditions = append(conditions, "mr.requesting_course_id = $"+string(rune('0'+argIdx)))
		args = append(args, filter.RequestingCourseID)
		argIdx++
	}

	query := `SELECT mr.id, mr.requesting_course_id, mr.requested_by, mr.purpose, mr.material_id,
		mr.requested_at, mr.reviewed_at, mr.reviewed_by, mr.status, mr.review_note, mr.is_active,
		m.id, m.title, m.type, m.url, m.session_id, m.topic_id, m.description, m.created_at, m.updated_at,
		rc.id, rc.code, rc.name, rc.sks, rc.description, rc.course_type, rc.cawu_id, rc.created_at, rc.updated_at,
		sc.id, sc.code, sc.name, sc.sks, sc.description, sc.course_type, sc.cawu_id, sc.created_at, sc.updated_at
		FROM material_requests mr
		JOIN materials m ON m.id = mr.material_id
		JOIN courses rc ON rc.id = mr.requesting_course_id
		LEFT JOIN sessions s ON s.id = m.session_id
		LEFT JOIN courses sc ON sc.id = COALESCE(s.course_id,
			(SELECT course_id FROM topics WHERE id = m.topic_id))
		WHERE ` + strings.Join(conditions, " AND ") + `
		ORDER BY mr.requested_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.MaterialRequestWithDetails
	for rows.Next() {
		var item domain.MaterialRequestWithDetails
		var reviewedBy sql.NullString
		var reviewedAt sql.NullTime
		var reviewNote sql.NullString
		var m domain.Material
		var rc, sc domain.Course
		var mSessionID, mTopicID, rcCawuID, scCawuID sql.NullInt64
		var rcCode, rcName, rcDesc, rcType, scCode, scName, scDesc, scType sql.NullString
		var rcSks, scSks sql.NullInt64
		var rcCreated, rcUpdated, scCreated, scUpdated, mCreated, mUpdated sql.NullTime
		var mCreatedBy sql.NullString

		err := rows.Scan(
			&item.ID, &item.RequestingCourseID, &item.RequestedBy, &item.Purpose, &item.MaterialID,
			&item.RequestedAt, &reviewedAt, &reviewedBy, &item.Status, &reviewNote, &item.IsActive,
			&m.ID, &m.Title, &m.Type, &m.URL, &mSessionID, &mTopicID, &m.Description, &mCreated, &mUpdated,
			&rc.ID, &rcCode, &rcName, &rcSks, &rcDesc, &rcType, &rcCawuID, &rcCreated, &rcUpdated,
			&sc.ID, &scCode, &scName, &scSks, &scDesc, &scType, &scCawuID, &scCreated, &scUpdated,
		)
		if err != nil {
			return nil, err
		}

		if reviewedBy.Valid {
			item.ReviewedBy = &reviewedBy.String
		}
		if reviewedAt.Valid {
			item.ReviewedAt = &reviewedAt.Time
		}
		if reviewNote.Valid {
			item.ReviewNote = reviewNote.String
		}
		if mSessionID.Valid {
			sid := int(mSessionID.Int64)
			m.SessionID = &sid
		}
		if mTopicID.Valid {
			tid := int(mTopicID.Int64)
			m.TopicID = &tid
		}
		if mCreatedBy.Valid {
			m.CreatedBy = &mCreatedBy.String
		}
		if mCreated.Valid {
			m.CreatedAt = mCreated.Time
		}
		if mUpdated.Valid {
			m.UpdatedAt = mUpdated.Time
		}

		item.Material = &m
		item.RequestingCourse = scanCourse(rc.ID, rcCode, rcName, rcSks, rcDesc, rcType, rcCawuID, rcCreated, rcUpdated)
		if sc.ID != 0 {
			item.SourceCourse = scanCourse(sc.ID, scCode, scName, scSks, scDesc, scType, scCawuID, scCreated, scUpdated)
		}

		results = append(results, item)
	}
	return results, rows.Err()
}

func (r *MaterialRequestRepo) UpdateReview(req *domain.MaterialRequest) error {
	query := `UPDATE material_requests
		SET reviewed_at = NOW(), reviewed_by = $1, status = $2, review_note = $3
		WHERE id = $4 AND is_active = true`

	result, err := r.db.Exec(query, req.ReviewedBy, req.Status, req.ReviewNote, req.ID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *MaterialRequestRepo) ExistsPending(requestingCourseID, materialID int) (bool, int, error) {
	query := `SELECT id FROM material_requests
		WHERE requesting_course_id = $1 AND material_id = $2 AND status = 'pending' AND is_active = true`

	var id int
	err := r.db.QueryRow(query, requestingCourseID, materialID).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return false, 0, nil
	}
	if err != nil {
		return false, 0, err
	}
	return true, id, nil
}

func (r *MaterialRequestRepo) CountPending() (int, error) {
	query := `SELECT COUNT(*) FROM material_requests WHERE status = 'pending' AND is_active = true`
	var count int
	err := r.db.QueryRow(query).Scan(&count)
	return count, err
}

func scanCourse(id int, code, name sql.NullString, sks sql.NullInt64,
	desc, cType sql.NullString, cawuID sql.NullInt64,
	created, updated sql.NullTime) *domain.Course {
	if id == 0 {
		return nil
	}
	c := &domain.Course{ID: id}
	if code.Valid {
		c.Code = code.String
	}
	if name.Valid {
		c.Name = name.String
	}
	if sks.Valid {
		c.SKS = int(sks.Int64)
	}
	if desc.Valid {
		c.Description = desc.String
	}
	if cType.Valid {
		c.CourseType = cType.String
	}
	if cawuID.Valid {
		c.CawuID = domain.NullInt64{NullInt64: sql.NullInt64{Int64: cawuID.Int64, Valid: true}}
	}
	if created.Valid {
		c.CreatedAt = created.Time
	}
	if updated.Valid {
		c.UpdatedAt = updated.Time
	}
	return c
}
