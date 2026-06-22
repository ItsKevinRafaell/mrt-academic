package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type SharedMaterialRepo struct {
	db *sql.DB
}

func NewSharedMaterialRepo(db *sql.DB) *SharedMaterialRepo {
	return &SharedMaterialRepo{db: db}
}

func (r *SharedMaterialRepo) Create(sm *domain.SharedMaterial) error {
	query := `INSERT INTO shared_materials (request_id, material_id, target_course_id, source_course_id, shared_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, shared_at, is_active`

	return r.db.QueryRow(query, sm.RequestID, sm.MaterialID, sm.TargetCourseID, sm.SourceCourseID, sm.SharedBy).
		Scan(&sm.ID, &sm.SharedAt, &sm.IsActive)
}

func (r *SharedMaterialRepo) GetByTargetCourse(courseID int) ([]domain.SharedMaterialWithDetails, error) {
	query := `SELECT sm.id, sm.request_id, sm.material_id, sm.target_course_id, sm.source_course_id,
		sm.shared_by, sm.shared_at, sm.is_active,
		m.id, m.session_id, m.topic_id, m.title, m.description, m.type, m.url, m.created_by, m.created_at, m.updated_at,
		sc.id, sc.code, sc.name, sc.sks, sc.description, sc.course_type, sc.cawu_id, sc.created_at, sc.updated_at
		FROM shared_materials sm
		JOIN materials m ON m.id = sm.material_id
		JOIN courses sc ON sc.id = sm.source_course_id
		WHERE sm.target_course_id = $1 AND sm.is_active = true
		ORDER BY sm.shared_at DESC`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.SharedMaterialWithDetails
	for rows.Next() {
		var item domain.SharedMaterialWithDetails
		var m domain.Material
		var sc domain.Course
		var mSessionID, mTopicID, scCawuID sql.NullInt64
		var scCode, scName, scDesc, scType sql.NullString
		var scSks sql.NullInt64
		var scCreated, scUpdated, mCreated, mUpdated sql.NullTime

		err := rows.Scan(
			&item.ID, &item.RequestID, &item.MaterialID, &item.TargetCourseID, &item.SourceCourseID,
			&item.SharedBy, &item.SharedAt, &item.IsActive,
			&m.ID, &mSessionID, &mTopicID, &m.Title, &m.Description, &m.Type, &m.URL, &mCreated, &mUpdated,
			&sc.ID, &scCode, &scName, &scSks, &scDesc, &scType, &scCawuID, &scCreated, &scUpdated,
		)
		if err != nil {
			return nil, err
		}

		if mSessionID.Valid {
			sid := int(mSessionID.Int64)
			m.SessionID = &sid
		}
		if mTopicID.Valid {
			tid := int(mTopicID.Int64)
			m.TopicID = &tid
		}
		if mCreated.Valid {
			m.CreatedAt = mCreated.Time
		}
		if mUpdated.Valid {
			m.UpdatedAt = mUpdated.Time
		}

		if scCode.Valid {
			sc.Code = scCode.String
		}
		if scName.Valid {
			sc.Name = scName.String
		}
		if scSks.Valid {
			sc.SKS = int(scSks.Int64)
		}
		if scDesc.Valid {
			sc.Description = scDesc.String
		}
		if scType.Valid {
			sc.CourseType = scType.String
		}
		if scCawuID.Valid {
			sc.CawuID = domain.NullInt64{NullInt64: sql.NullInt64{Int64: scCawuID.Int64, Valid: true}}
		}
		if scCreated.Valid {
			sc.CreatedAt = scCreated.Time
		}
		if scUpdated.Valid {
			sc.UpdatedAt = scUpdated.Time
		}

		item.Material = &m
		item.SourceCourse = &sc
		results = append(results, item)
	}
	return results, rows.Err()
}

func (r *SharedMaterialRepo) ExistsShared(materialID, targetCourseID int) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM shared_materials
		WHERE material_id = $1 AND target_course_id = $2 AND is_active = true)`
	var exists bool
	err := r.db.QueryRow(query, materialID, targetCourseID).Scan(&exists)
	return exists, err
}

func (r *SharedMaterialRepo) GetByCourseID(courseID int) ([]domain.SharedMaterial, error) {
	query := `SELECT id, request_id, material_id, target_course_id, source_course_id,
		shared_by, shared_at, is_active
		FROM shared_materials
		WHERE source_course_id = $1 OR target_course_id = $1
		ORDER BY shared_at DESC`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.SharedMaterial
	for rows.Next() {
		var sm domain.SharedMaterial
		if err := rows.Scan(&sm.ID, &sm.RequestID, &sm.MaterialID, &sm.TargetCourseID,
			&sm.SourceCourseID, &sm.SharedBy, &sm.SharedAt, &sm.IsActive); err != nil {
			return nil, err
		}
		results = append(results, sm)
	}
	return results, rows.Err()
}
