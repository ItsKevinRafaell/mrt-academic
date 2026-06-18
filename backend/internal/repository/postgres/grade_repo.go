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
		INSERT INTO grades (user_id, course_id, component_id, grade, score)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ON CONSTRAINT unique_student_course_component
		DO UPDATE SET grade = EXCLUDED.grade, score = EXCLUDED.score, updated_at = NOW()
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, g.UserID, g.CourseID, g.ComponentID, g.Grade, g.Score).
		Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt)
}

func (r *GradeRepo) CreateBulk(grades []domain.Grade) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO grades (user_id, course_id, component_id, grade, score)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ON CONSTRAINT unique_student_course_component
		DO UPDATE SET grade = EXCLUDED.grade, score = EXCLUDED.score, updated_at = NOW()
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, g := range grades {
		_, err := stmt.Exec(g.UserID, g.CourseID, g.ComponentID, g.Grade, g.Score)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
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

func (r *GradeRepo) GetIPKData(userID string) ([]domain.IPKData, error) {
	// Get all courses with their grade components and user's scores
	query := `
		SELECT
			c.id as course_id,
			c.code as course_code,
			c.name as course_name,
			c.sks,
			COALESCE(c.cawu_id, 0) as cawu_id,
			gc.id as component_id,
			gc.name as component_name,
			gc.weight as component_weight,
			g.score as component_score
		FROM courses c
		LEFT JOIN grade_components gc ON c.id = gc.course_id
		LEFT JOIN grades g ON g.course_id = c.id
			AND g.component_id = gc.id
			AND g.user_id = $1
		ORDER BY COALESCE(c.cawu_id, 0), c.code, gc.id
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	courseMap := make(map[int]*domain.IPKData)

	for rows.Next() {
		var courseID, cawuID int
		var courseCode, courseName string
		var sks int
		var componentID sql.NullInt64
		var componentName sql.NullString
		var componentWeight sql.NullFloat64
		var componentScore sql.NullFloat64

		err := rows.Scan(
			&courseID,
			&courseCode,
			&courseName,
			&sks,
			&cawuID,
			&componentID,
			&componentName,
			&componentWeight,
			&componentScore,
		)
		if err != nil {
			return nil, err
		}

		// Create course entry if not exists
		if _, exists := courseMap[courseID]; !exists {
			courseMap[courseID] = &domain.IPKData{
				CourseID:    courseID,
				CourseCode:  courseCode,
				CourseName:  courseName,
				SKS:         sks,
				CawuID:      cawuID,
				Components:  []domain.GradeComponentWithScore{},
			}
		}

		// Add component if exists
		if componentID.Valid {
			comp := domain.GradeComponentWithScore{
				ID:        int(componentID.Int64),
				Name:      componentName.String,
				Weight:    componentWeight.Float64,
				Score:     nil,
			}
			if componentScore.Valid {
				score := componentScore.Float64
				comp.Score = &score
			}
			courseMap[courseID].Components = append(courseMap[courseID].Components, comp)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Convert map to slice
	result := make([]domain.IPKData, 0, len(courseMap))
	for _, course := range courseMap {
		result = append(result, *course)
	}

	return result, nil
}

// GetGradesForCourse returns all grade components with user's scores for a specific course
func (r *GradeRepo) GetGradesForCourse(userID string, courseID int) ([]domain.GradeComponentWithScore, error) {
	query := `
		SELECT
			gc.id,
			gc.name,
			gc.weight,
			g.score
		FROM grade_components gc
		LEFT JOIN grades g ON g.component_id = gc.id
			AND g.course_id = $2
			AND g.user_id = $1
		WHERE gc.course_id = $2
		ORDER BY gc.id
	`

	rows, err := r.db.Query(query, userID, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	components := []domain.GradeComponentWithScore{}
	for rows.Next() {
		var comp domain.GradeComponentWithScore
		var score sql.NullFloat64

		err := rows.Scan(&comp.ID, &comp.Name, &comp.Weight, &score)
		if err != nil {
			return nil, err
		}

		if score.Valid {
			s := score.Float64
			comp.Score = &s
		}
		components = append(components, comp)
	}

	return components, rows.Err()
}

func (r *GradeRepo) CalculateGPA(userID string) (*domain.GPASummary, error) {
	query := `
		WITH course_scores AS (
			SELECT
				g.course_id,
				c.sks,
				c.cawu_id,
				COALESCE(SUM(g.score * gc.weight) / NULLIF(SUM(gc.weight), 0), 0) as weighted_score
			FROM grades g
			JOIN courses c ON g.course_id = c.id
			JOIN grade_components gc ON g.component_id = gc.id
			WHERE g.user_id = $1
			GROUP BY g.course_id, c.sks, c.cawu_id
		),
		graded_courses AS (
			SELECT
				course_id,
				sks,
				cawu_id,
				weighted_score,
				CASE
					WHEN weighted_score >= 85 THEN 4.0
					WHEN weighted_score >= 80 THEN 3.7
					WHEN weighted_score >= 75 THEN 3.3
					WHEN weighted_score >= 70 THEN 3.0
					WHEN weighted_score >= 65 THEN 2.7
					WHEN weighted_score >= 60 THEN 2.3
					WHEN weighted_score >= 55 THEN 2.0
					WHEN weighted_score >= 40 THEN 1.0
					ELSE 0.0
				END as grade_point
			FROM course_scores
		)
		SELECT
			COALESCE(SUM(grade_point * sks) / NULLIF(SUM(sks), 0), 0) as cumulative_gpa,
			COALESCE(SUM(sks), 0) as total_sks
		FROM graded_courses
	`

	var cumulativeGPA float64
	var totalSKS int
	err := r.db.QueryRow(query, userID).Scan(&cumulativeGPA, &totalSKS)
	if err != nil {
		return nil, err
	}

	summary := &domain.GPASummary{
		CumulativeGPA: cumulativeGPA,
		TotalSKS:      totalSKS,
		PerCawu:       []domain.GPAPerCawu{},
	}

	cawuQuery := `
		WITH course_scores AS (
			SELECT
				g.course_id,
				c.sks,
				c.cawu_id,
				COALESCE(SUM(g.score * gc.weight) / NULLIF(SUM(gc.weight), 0), 0) as weighted_score
			FROM grades g
			JOIN courses c ON g.course_id = c.id
			JOIN grade_components gc ON g.component_id = gc.id
			WHERE g.user_id = $1
			GROUP BY g.course_id, c.sks, c.cawu_id
		),
		graded_courses AS (
			SELECT
				course_id, sks, cawu_id,
				CASE
					WHEN weighted_score >= 85 THEN 4.0
					WHEN weighted_score >= 80 THEN 3.7
					WHEN weighted_score >= 75 THEN 3.3
					WHEN weighted_score >= 70 THEN 3.0
					WHEN weighted_score >= 65 THEN 2.7
					WHEN weighted_score >= 60 THEN 2.3
					WHEN weighted_score >= 55 THEN 2.0
					WHEN weighted_score >= 40 THEN 1.0
					ELSE 0.0
				END as grade_point
			FROM course_scores
		)
		SELECT
			caw.name,
			COALESCE(SUM(gc.grade_point * gc.sks) / NULLIF(SUM(gc.sks), 0), 0) as gpa,
			COALESCE(SUM(gc.sks), 0) as sks
		FROM graded_courses gc
		JOIN cawu caw ON gc.cawu_id = caw.id
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
