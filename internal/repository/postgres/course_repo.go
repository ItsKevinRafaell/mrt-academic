package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"

	"github.com/lib/pq"
)

type CourseRepo struct {
	db *sql.DB
}

func NewCourseRepo(db *sql.DB) *CourseRepo {
	return &CourseRepo{db: db}
}

func (r *CourseRepo) Create(course *domain.Course) error {
	query := `INSERT INTO courses (code, name, sks, description)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	err := r.db.QueryRow(query, course.Code, course.Name, course.SKS, course.Description).
		Scan(&course.ID, &course.CreatedAt, &course.UpdatedAt)

	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return domain.ErrAlreadyExists
	}
	return err
}

func (r *CourseRepo) GetAll() ([]domain.Course, error) {
	query := `SELECT c.id, c.code, c.name, c.sks, c.description, c.created_at, c.updated_at,
		COALESCE(ARRAY_AGG(ci.instructor_name) FILTER (WHERE ci.instructor_name IS NOT NULL), '{}')
		FROM courses c
		LEFT JOIN course_instructors ci ON ci.course_id = c.id
		GROUP BY c.id
		ORDER BY c.code`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []domain.Course
	for rows.Next() {
		var c domain.Course
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.SKS, &c.Description,
			&c.CreatedAt, &c.UpdatedAt, pq.Array(&c.Instructors)); err != nil {
			return nil, err
		}
		courses = append(courses, c)
	}
	return courses, rows.Err()
}

func (r *CourseRepo) GetByID(id int) (*domain.Course, error) {
	c := &domain.Course{}
	query := `SELECT id, code, name, sks, description, created_at, updated_at
		FROM courses WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&c.ID, &c.Code, &c.Name, &c.SKS, &c.Description,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	instrQuery := `SELECT instructor_name FROM course_instructors WHERE course_id = $1`
	rows, err := r.db.Query(instrQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		c.Instructors = append(c.Instructors, name)
	}
	return c, rows.Err()
}

func (r *CourseRepo) Update(course *domain.Course) error {
	query := `UPDATE courses SET code = $1, name = $2, sks = $3, description = $4, updated_at = NOW()
		WHERE id = $5 RETURNING updated_at`

	err := r.db.QueryRow(query, course.Code, course.Name, course.SKS, course.Description, course.ID).
		Scan(&course.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	return err
}

func (r *CourseRepo) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM courses WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}
