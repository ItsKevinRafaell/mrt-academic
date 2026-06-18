package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
)

type ScheduleRepo struct {
	db *sql.DB
}

func NewScheduleRepo(db *sql.DB) *ScheduleRepo {
	return &ScheduleRepo{db: db}
}

func (r *ScheduleRepo) Create(s *domain.Schedule) error {
	query := `
		INSERT INTO schedules (course_id, day_of_week, start_time, end_time, session_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, s.CourseID, s.DayOfWeek, s.StartTime, s.EndTime, s.SessionID).
		Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
}

func (r *ScheduleRepo) GetAll() ([]domain.ScheduleWithCourse, error) {
	query := `
		SELECT s.id, s.course_id, s.day_of_week, s.start_time, s.end_time, s.session_id, s.created_at, s.updated_at,
			c.code, c.name
		FROM schedules s
		JOIN courses c ON s.course_id = c.id
		ORDER BY s.day_of_week, s.start_time
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []domain.ScheduleWithCourse
	for rows.Next() {
		var sw domain.ScheduleWithCourse
		err := rows.Scan(&sw.ID, &sw.CourseID, &sw.DayOfWeek, &sw.StartTime, &sw.EndTime,
			&sw.SessionID, &sw.CreatedAt, &sw.UpdatedAt, &sw.CourseCode, &sw.CourseName)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, sw)
	}
	return schedules, rows.Err()
}

func (r *ScheduleRepo) GetByCourseID(courseID int) ([]domain.Schedule, error) {
	query := `
		SELECT id, course_id, day_of_week, start_time, end_time, session_id, created_at, updated_at
		FROM schedules
		WHERE course_id = $1
		ORDER BY day_of_week, start_time
	`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []domain.Schedule
	for rows.Next() {
		var s domain.Schedule
		err := rows.Scan(&s.ID, &s.CourseID, &s.DayOfWeek, &s.StartTime, &s.EndTime,
			&s.SessionID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, rows.Err()
}

func (r *ScheduleRepo) GetByID(id int) (*domain.ScheduleWithCourse, error) {
	query := `
		SELECT s.id, s.course_id, s.day_of_week, s.start_time, s.end_time, s.session_id, s.created_at, s.updated_at,
			c.code, c.name
		FROM schedules s
		JOIN courses c ON s.course_id = c.id
		WHERE s.id = $1
	`

	var sw domain.ScheduleWithCourse
	err := r.db.QueryRow(query, id).Scan(&sw.ID, &sw.CourseID, &sw.DayOfWeek, &sw.StartTime, &sw.EndTime,
		&sw.SessionID, &sw.CreatedAt, &sw.UpdatedAt, &sw.CourseCode, &sw.CourseName)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return &sw, err
}

func (r *ScheduleRepo) GetActive(dayOfWeek int, currentTime string) ([]domain.ScheduleWithCourse, error) {
	query := `
		SELECT s.id, s.course_id, s.day_of_week, s.start_time, s.end_time, s.session_id, s.created_at, s.updated_at,
			c.code, c.name
		FROM schedules s
		JOIN courses c ON s.course_id = c.id
		WHERE s.day_of_week = $1 AND s.start_time <= $2 AND s.end_time >= $2
		ORDER BY s.start_time
	`

	rows, err := r.db.Query(query, dayOfWeek, currentTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []domain.ScheduleWithCourse
	for rows.Next() {
		var sw domain.ScheduleWithCourse
		err := rows.Scan(&sw.ID, &sw.CourseID, &sw.DayOfWeek, &sw.StartTime, &sw.EndTime,
			&sw.SessionID, &sw.CreatedAt, &sw.UpdatedAt, &sw.CourseCode, &sw.CourseName)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, sw)
	}
	return schedules, rows.Err()
}

func (r *ScheduleRepo) Update(s *domain.Schedule) error {
	query := `
		UPDATE schedules
		SET course_id = $1, day_of_week = $2, start_time = $3, end_time = $4, session_id = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	return r.db.QueryRow(query, s.CourseID, s.DayOfWeek, s.StartTime, s.EndTime, s.SessionID, s.ID).
		Scan(&s.UpdatedAt)
}

func (r *ScheduleRepo) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM schedules WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
