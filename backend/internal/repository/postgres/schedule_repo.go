package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"mrt-backend/internal/domain"
	"strings"
)

type ScheduleRepo struct {
	db *sql.DB
}

func NewScheduleRepo(db *sql.DB) *ScheduleRepo {
	return &ScheduleRepo{db: db}
}

func (r *ScheduleRepo) Create(s *domain.Schedule) error {
	query := `
		INSERT INTO schedules (course_id, day_of_week, start_time, end_time, session_id, topic_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, s.CourseID, s.DayOfWeek, s.StartTime, s.EndTime, s.SessionID, s.TopicID).
		Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
}

func (r *ScheduleRepo) GetAll() ([]domain.ScheduleWithCourse, error) {
	query := `
		SELECT s.id, s.course_id, s.day_of_week, s.start_time, s.end_time, s.session_id, s.topic_id, s.created_at, s.updated_at,
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
			&sw.SessionID, &sw.TopicID, &sw.CreatedAt, &sw.UpdatedAt, &sw.CourseCode, &sw.CourseName)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, sw)
	}
	return schedules, rows.Err()
}

func (r *ScheduleRepo) GetByCourseID(courseID int) ([]domain.Schedule, error) {
	query := `
		SELECT id, course_id, day_of_week, start_time, end_time, session_id, topic_id, created_at, updated_at
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
			&s.SessionID, &s.TopicID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, rows.Err()
}

func (r *ScheduleRepo) GetByID(id int) (*domain.ScheduleWithCourse, error) {
	query := `
		SELECT s.id, s.course_id, s.day_of_week, s.start_time, s.end_time, s.session_id, s.topic_id, s.created_at, s.updated_at,
			c.code, c.name
		FROM schedules s
		JOIN courses c ON s.course_id = c.id
		WHERE s.id = $1
	`

	var sw domain.ScheduleWithCourse
	err := r.db.QueryRow(query, id).Scan(&sw.ID, &sw.CourseID, &sw.DayOfWeek, &sw.StartTime, &sw.EndTime,
		&sw.SessionID, &sw.TopicID, &sw.CreatedAt, &sw.UpdatedAt, &sw.CourseCode, &sw.CourseName)
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

func (r *ScheduleRepo) GetActiveWithTopics(dayOfWeek int, currentTime string) ([]domain.CurrentSchedule, error) {
	query := `
		SELECT s.id, s.course_id, c.code, c.name, s.session_id, t.id as topic_id, t.title as topic_title,
			CASE WHEN ses.number > 0 THEN ses.number ELSE NULL END as session_number,
			s.start_time, s.end_time
		FROM schedules s
		JOIN courses c ON s.course_id = c.id
		LEFT JOIN sessions ses ON s.session_id = ses.id
		LEFT JOIN topics t ON COALESCE(s.topic_id, ses.topic_id) = t.id
		WHERE s.day_of_week = $1 AND s.start_time <= $2 AND s.end_time >= $2
		ORDER BY s.start_time
	`

	rows, err := r.db.Query(query, dayOfWeek, currentTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []domain.CurrentSchedule
	for rows.Next() {
		var cs domain.CurrentSchedule
		var topicID, sessionNum sql.NullInt64
		var topicTitle sql.NullString
		err := rows.Scan(&cs.ScheduleID, &cs.CourseID, &cs.CourseCode, &cs.CourseName,
			&cs.SessionID, &topicID, &topicTitle, &sessionNum, &cs.StartTime, &cs.EndTime)
		if err != nil {
			return nil, err
		}
		if topicID.Valid {
			tid := int(topicID.Int64)
			cs.TopicID = &tid
		}
		if topicTitle.Valid {
			cs.TopicTitle = topicTitle.String
		}
		if sessionNum.Valid {
			sn := int(sessionNum.Int64)
			cs.SessionNum = &sn
		}
		cs.TimeLeftMin = calcTimeLeft(cs.EndTime, currentTime)
		schedules = append(schedules, cs)
	}
	return schedules, rows.Err()
}

func calcTimeLeft(endTime, currentTime string) int {
	endMin := parseMinutesFromTime(endTime)
	currMin := parseMinutesFromTime(currentTime)
	left := endMin - currMin
	if left < 0 {
		return 0
	}
	return left
}

func parseMinutesFromTime(s string) int {
	if t := strings.LastIndex(s, "T"); t >= 0 && t+1 < len(s) {
		s = s[t+1:]
	}
	if z := strings.Index(s, "Z"); z >= 0 {
		s = s[:z]
	}
	var h, m, sec int
	fmt.Sscanf(s, "%d:%d:%d", &h, &m, &sec)
	return h*60 + m
}

func (r *ScheduleRepo) Update(s *domain.Schedule) error {
	query := `
		UPDATE schedules
		SET course_id = $1, day_of_week = $2, start_time = $3, end_time = $4, session_id = $5, topic_id = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING updated_at
	`
	return r.db.QueryRow(query, s.CourseID, s.DayOfWeek, s.StartTime, s.EndTime, s.SessionID, s.TopicID, s.ID).
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
