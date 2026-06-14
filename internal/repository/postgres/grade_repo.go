package postgres

import (
	"database/sql"
	"mrt-backend/internal/domain"
)

type GradeRepo struct {
	db *sql.DB
}

func NewGradeRepo(db *sql.DB) *GradeRepo {
	return &GradeRepo{db: db}
}

func (r *GradeRepo) Create(g *domain.Grade) error {
	query := `
		INSERT INTO grades (user_id, course_id, grade)
		VALUES ($1, $2, $3)
		ON CONFLICT ON CONSTRAINT grades_user_course_unique
		DO UPDATE SET grade = EXCLUDED.grade
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, g.UserID, g.CourseID, g.Grade).
		Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt)
}

func (r *GradeRepo) GetByUserID(userID string) ([]domain.Grade, error) {
	query := `
		SELECT g.id, g.user_id, g.course_id, g.grade, g.created_at, g.updated_at,
			   c.code, c.name, c.sks
		FROM grades g
		JOIN courses c ON g.course_id = c.id
		WHERE g.user_id = $1
		ORDER BY c.code
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grades []domain.Grade
	for rows.Next() {
		var g domain.Grade
		err := rows.Scan(
			&g.ID, &g.UserID, &g.CourseID, &g.Grade, &g.CreatedAt, &g.UpdatedAt,
			&g.Course.Code, &g.Course.Name, &g.Course.SKS,
		)
		if err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, rows.Err()
}

func (r *GradeRepo) CalculateGPA(userID string) (*domain.GPASummary, error) {
	query := `
		SELECT
			SUM(CASE
				WHEN g.grade = 'A' THEN 4.0 * c.sks
				WHEN g.grade = 'A-' THEN 3.7 * c.sks
				WHEN g.grade = 'B+' THEN 3.3 * c.sks
				WHEN g.grade = 'B' THEN 3.0 * c.sks
				WHEN g.grade = 'B-' THEN 2.7 * c.sks
				WHEN g.grade = 'C+' THEN 2.3 * c.sks
				WHEN g.grade = 'C' THEN 2.0 * c.sks
				WHEN g.grade = 'D' THEN 1.0 * c.sks
				ELSE 0.0 * c.sks
			END) / NULLIF(SUM(c.sks), 0) as cumulative_gpa,
			SUM(c.sks) as total_sks
		FROM grades g
		JOIN courses c ON g.course_id = c.id
		WHERE g.user_id = $1
	`

	var cumulativeGPA sql.NullFloat64
	var totalSKS sql.NullInt64
	err := r.db.QueryRow(query, userID).Scan(&cumulativeGPA, &totalSKS)
	if err != nil {
		return nil, err
	}

	summary := &domain.GPASummary{
		CumulativeGPA: 0.0,
		TotalSKS:      0,
		PerCawu:       []domain.GPAPerCawu{},
	}

	if cumulativeGPA.Valid {
		summary.CumulativeGPA = cumulativeGPA.Float64
	}
	if totalSKS.Valid {
		summary.TotalSKS = int(totalSKS.Int64)
	}

	cawuQuery := `
		SELECT
			caw.name,
			COALESCE(SUM(CASE
				WHEN g.grade = 'A' THEN 4.0 * c.sks
				WHEN g.grade = 'A-' THEN 3.7 * c.sks
				WHEN g.grade = 'B+' THEN 3.3 * c.sks
				WHEN g.grade = 'B' THEN 3.0 * c.sks
				WHEN g.grade = 'B-' THEN 2.7 * c.sks
				WHEN g.grade = 'C+' THEN 2.3 * c.sks
				WHEN g.grade = 'C' THEN 2.0 * c.sks
				WHEN g.grade = 'D' THEN 1.0 * c.sks
				ELSE 0.0 * c.sks
			END) / NULLIF(SUM(c.sks), 0), 0) as gpa,
			COALESCE(SUM(c.sks), 0) as sks
		FROM grades g
		JOIN courses c ON g.course_id = c.id
		JOIN cawu caw ON c.cawu_id = caw.id
		WHERE g.user_id = $1
		GROUP BY caw.id, caw.name
		ORDER BY caw.id
	`

	rows, err := r.db.Query(cawuQuery, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var cawu domain.GPAPerCawu
		err := rows.Scan(&cawu.CawuName, &cawu.GPA, &cawu.SKS)
		if err != nil {
			return nil, err
		}
		summary.PerCawu = append(summary.PerCawu, cawu)
	}

	return summary, rows.Err()
}
