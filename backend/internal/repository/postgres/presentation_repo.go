package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type PresentationRepo struct {
	db *sql.DB
}

func NewPresentationRepo(db *sql.DB) *PresentationRepo {
	return &PresentationRepo{db: db}
}

func (r *PresentationRepo) GetOrCreateConfig(courseID int) (*domain.PresentationConfig, error) {
	config := &domain.PresentationConfig{}
	query := `
		SELECT id, course_id, mode, priority_limit, COALESCE(start_nomor_urut, 1), next_nomor_urut, created_at, updated_at
		FROM course_presentation_config
		WHERE course_id = $1`

	err := r.db.QueryRow(query, courseID).Scan(
		&config.ID, &config.CourseID, &config.Mode, &config.PriorityLimit,
		&config.StartNomorUrut, &config.NextNomorUrut, &config.CreatedAt, &config.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		query = `
			INSERT INTO course_presentation_config (course_id, mode, priority_limit, start_nomor_urut, next_nomor_urut)
			VALUES ($1, 'prioritas', 5, 1, 1)
			RETURNING id, course_id, mode, priority_limit, start_nomor_urut, next_nomor_urut, created_at, updated_at`
		err = r.db.QueryRow(query, courseID).Scan(
			&config.ID, &config.CourseID, &config.Mode, &config.PriorityLimit,
			&config.StartNomorUrut, &config.NextNomorUrut, &config.CreatedAt, &config.UpdatedAt,
		)
	}
	return config, err
}

func (r *PresentationRepo) UpdateConfig(config *domain.PresentationConfig) error {
	query := `
		UPDATE course_presentation_config
		SET mode = $2, priority_limit = $3, start_nomor_urut = $4, next_nomor_urut = $5, updated_at = CURRENT_TIMESTAMP
		WHERE course_id = $1`
	_, err := r.db.Exec(query, config.CourseID, config.Mode, config.PriorityLimit, config.StartNomorUrut, config.NextNomorUrut)
	return err
}

func (r *PresentationRepo) GetPriorityStudents(courseID int) ([]domain.PriorityStudent, error) {
	query := `
		SELECT ps.id, ps.course_id, ps.user_id, COALESCE(u.full_name, ''), COALESCE(u.nomor_urut, 0), ps.priority_order, ps.created_at
		FROM course_priority_students ps
		LEFT JOIN users u ON ps.user_id = u.id
		WHERE ps.course_id = $1
		ORDER BY ps.priority_order ASC`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []domain.PriorityStudent
	for rows.Next() {
		var s domain.PriorityStudent
		if err := rows.Scan(&s.ID, &s.CourseID, &s.UserID, &s.UserName, &s.NomorUrut, &s.PriorityOrder, &s.CreatedAt); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, rows.Err()
}

func (r *PresentationRepo) AddPriorityStudent(courseID int, userID string, order int) error {
	query := `
		INSERT INTO course_priority_students (course_id, user_id, priority_order)
		VALUES ($1, $2, $3)
		ON CONFLICT (course_id, user_id) DO UPDATE SET priority_order = $3`
	_, err := r.db.Exec(query, courseID, userID, order)
	return err
}

func (r *PresentationRepo) RemovePriorityStudent(courseID int, userID string) error {
	query := `DELETE FROM course_priority_students WHERE course_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, courseID, userID)
	return err
}

func (r *PresentationRepo) ReorderPriorityStudents(courseID int, userIDs []string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `UPDATE course_priority_students SET priority_order = $1 WHERE course_id = $2 AND user_id = $3`
	for i, uid := range userIDs {
		if _, err := tx.Exec(query, i, courseID, uid); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *PresentationRepo) RecordPresentation(courseID int, userID string, topic string, points int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO presentation_records (course_id, user_id, topic, points)
		VALUES ($1, $2, $3, $4)`
	_, err = tx.Exec(query, courseID, userID, topic, points)
	if err != nil {
		return err
	}

	// Remove from priority list after recording
	deleteQuery := `DELETE FROM course_priority_students WHERE course_id = $1 AND user_id = $2`
	tx.Exec(deleteQuery, courseID, userID)

	// Update next nomor urut
	updateQuery := `
		UPDATE course_presentation_config
		SET next_nomor_urut = (
			SELECT COALESCE(MAX(nomor_urut), 0) + 1
			FROM users
			WHERE nomor_urut >= (
				SELECT next_nomor_urut FROM course_presentation_config WHERE course_id = $1
			)
		)
		WHERE course_id = $1`
	tx.Exec(updateQuery, courseID)

	return tx.Commit()
}

func (r *PresentationRepo) GetStudentHistory(courseID int, userID string) ([]domain.PresentationRecord, error) {
	query := `
		SELECT pr.id, pr.course_id, pr.user_id, COALESCE(u.full_name, ''), COALESCE(u.nomor_urut, 0),
		       pr.presented_at, COALESCE(pr.topic, ''), pr.points, pr.approved_by, pr.approved_at
		FROM presentation_records pr
		LEFT JOIN users u ON pr.user_id = u.id
		WHERE pr.course_id = $1 AND pr.user_id = $2
		ORDER BY pr.presented_at DESC`

	rows, err := r.db.Query(query, courseID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []domain.PresentationRecord
	for rows.Next() {
		var rec domain.PresentationRecord
		if err := rows.Scan(&rec.ID, &rec.CourseID, &rec.UserID, &rec.UserName, &rec.NomorUrut,
			&rec.PresentedAt, &rec.Topic, &rec.Points, &rec.ApprovedBy, &rec.ApprovedAt); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}

func (r *PresentationRepo) GetLeaderboard(courseID int) ([]domain.LeaderboardEntry, error) {
	query := `
		SELECT
			u.id as user_id,
			u.full_name,
			COALESCE(u.nomor_urut, 0),
			COALESCE(SUM(pr.points), 0) as total_points,
			COUNT(pr.id) as total_shows
		FROM users u
		JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'MAHASISWA'
		LEFT JOIN presentation_records pr ON u.id = pr.user_id AND pr.course_id = $1
		GROUP BY u.id, u.full_name, u.nomor_urut
		ORDER BY total_points DESC, u.nomor_urut ASC`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []domain.LeaderboardEntry
	for rows.Next() {
		var e domain.LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.UserName, &e.NomorUrut, &e.TotalPoints, &e.TotalShows); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *PresentationRepo) GetNextByNomorUrut(courseID int) (*domain.PriorityStudent, error) {
	query := `
		SELECT ps.id, ps.course_id, ps.user_id, COALESCE(u.full_name, ''), COALESCE(u.nomor_urut, 0), ps.priority_order, ps.created_at
		FROM course_priority_students ps
		JOIN users u ON ps.user_id = u.id
		WHERE ps.course_id = $1
		ORDER BY u.nomor_urut ASC
		LIMIT 1`

	s := &domain.PriorityStudent{}
	err := r.db.QueryRow(query, courseID).Scan(
		&s.ID, &s.CourseID, &s.UserID, &s.UserName, &s.NomorUrut, &s.PriorityOrder, &s.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *PresentationRepo) GetNextByPriority(courseID int) (*domain.PriorityStudent, error) {
	query := `
		SELECT ps.id, ps.course_id, ps.user_id, COALESCE(u.full_name, ''), COALESCE(u.nomor_urut, 0), ps.priority_order, ps.created_at
		FROM course_priority_students ps
		JOIN users u ON ps.user_id = u.id
		WHERE ps.course_id = $1
		ORDER BY ps.priority_order ASC
		LIMIT 1`

	s := &domain.PriorityStudent{}
	err := r.db.QueryRow(query, courseID).Scan(
		&s.ID, &s.CourseID, &s.UserID, &s.UserName, &s.NomorUrut, &s.PriorityOrder, &s.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *PresentationRepo) GetAllStudents() ([]domain.PriorityStudent, error) {
	query := `
		SELECT u.id, u.full_name, COALESCE(u.nomor_urut, 0)
		FROM users u
		JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'MAHASISWA'
		ORDER BY COALESCE(u.nomor_urut, 0) ASC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []domain.PriorityStudent
	for rows.Next() {
		var s domain.PriorityStudent
		if err := rows.Scan(&s.UserID, &s.UserName, &s.NomorUrut); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, rows.Err()
}

func (r *PresentationRepo) CreatePendingPresentation(courseID int, userID string, topic string, points int) error {
	query := `
		INSERT INTO presentation_pending (course_id, user_id, topic, points)
		VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(query, courseID, userID, topic, points)
	return err
}

func (r *PresentationRepo) GetPendingPresentations(courseID int) ([]domain.PendingPresentation, error) {
	query := `
		SELECT pp.id, pp.course_id, pp.user_id, COALESCE(u.full_name, ''), COALESCE(u.nomor_urut, 0),
		       pp.requested_at, COALESCE(pp.topic, ''), pp.points
		FROM presentation_pending pp
		LEFT JOIN users u ON pp.user_id = u.id
		WHERE pp.course_id = $1 AND pp.status = 'pending'
		ORDER BY pp.requested_at DESC`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var presentations []domain.PendingPresentation
	for rows.Next() {
		var p domain.PendingPresentation
		if err := rows.Scan(&p.ID, &p.CourseID, &p.UserID, &p.UserName, &p.NomorUrut,
			&p.RequestedAt, &p.Topic, &p.Points); err != nil {
			return nil, err
		}
		presentations = append(presentations, p)
	}
	return presentations, rows.Err()
}

func (r *PresentationRepo) ApprovePresentation(id int, approverID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var courseID int
	var userID, topic string
	var points int
	err = tx.QueryRow(
		`SELECT course_id, user_id, topic, points FROM presentation_pending WHERE id = $1 AND status = 'pending'`,
		id,
	).Scan(&courseID, &userID, &topic, &points)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		`INSERT INTO presentation_records (course_id, user_id, topic, points, approved_by, approved_at)
		 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
		courseID, userID, topic, points, approverID,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		`UPDATE presentation_pending SET status = 'approved', approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $1`,
		id, approverID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *PresentationRepo) RejectPresentation(id int) error {
	_, err := r.db.Exec(
		`UPDATE presentation_pending SET status = 'rejected' WHERE id = $1`,
		id,
	)
	return err
}
