package postgres

import (
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
)

type GradeComponentRepo struct {
	db *sql.DB
}

func NewGradeComponentRepo(db *sql.DB) *GradeComponentRepo {
	return &GradeComponentRepo{db: db}
}

func (r *GradeComponentRepo) Create(gc *domain.GradeComponent) error {
	query := `
		INSERT INTO grade_components (course_id, name, weight, type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, gc.CourseID, gc.Name, gc.Weight, gc.Type).
		Scan(&gc.ID, &gc.CreatedAt, &gc.UpdatedAt)
}

func (r *GradeComponentRepo) GetByCourseID(courseID int) ([]domain.GradeComponent, error) {
	query := `
		SELECT id, course_id, name, weight, type, created_at, updated_at
		FROM grade_components
		WHERE course_id = $1
		ORDER BY created_at
	`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var components []domain.GradeComponent
	for rows.Next() {
		var gc domain.GradeComponent
		err := rows.Scan(&gc.ID, &gc.CourseID, &gc.Name, &gc.Weight, &gc.Type, &gc.CreatedAt, &gc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		components = append(components, gc)
	}

	return components, rows.Err()
}

func (r *GradeComponentRepo) Update(gc *domain.GradeComponent) error {
	query := `
		UPDATE grade_components
		SET name = $1, weight = $2, type = $3, updated_at = NOW()
		WHERE id = $4
		RETURNING updated_at
	`
	return r.db.QueryRow(query, gc.Name, gc.Weight, gc.Type, gc.ID).Scan(&gc.UpdatedAt)
}

func (r *GradeComponentRepo) Delete(id int) error {
	query := `DELETE FROM grade_components WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("grade component not found")
	}
	return nil
}

func (r *GradeComponentRepo) GetByID(id int) (*domain.GradeComponent, error) {
	query := `
		SELECT id, course_id, name, weight, type, created_at, updated_at
		FROM grade_components
		WHERE id = $1
	`

	var gc domain.GradeComponent
	err := r.db.QueryRow(query, id).
		Scan(&gc.ID, &gc.CourseID, &gc.Name, &gc.Weight, &gc.Type, &gc.CreatedAt, &gc.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("grade component not found")
	}
	return &gc, err
}
