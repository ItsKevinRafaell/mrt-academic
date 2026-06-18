package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
)

type examArchiveRepository struct {
	db *sql.DB
}

func NewExamArchiveRepository(db *sql.DB) domain.ExamArchiveRepository {
	return &examArchiveRepository{db: db}
}

func (r *examArchiveRepository) Create(ctx context.Context, archive *domain.ExamArchive) error {
	query := `
		INSERT INTO exam_archives (course_id, title, description, exam_type, year, file_url, file_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		archive.CourseID,
		archive.Title,
		archive.Description,
		archive.ExamType,
		archive.Year,
		archive.FileURL,
		archive.FileType,
	).Scan(&archive.ID, &archive.CreatedAt, &archive.UpdatedAt)
}

func (r *examArchiveRepository) GetAll(ctx context.Context, courseID int) ([]domain.ExamArchive, error) {
	query := `
		SELECT id, course_id, title, description, exam_type, year, file_url, file_type, created_at, updated_at
		FROM exam_archives
		WHERE course_id = $1
		ORDER BY year DESC, exam_type, created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get exam archives: %w", err)
	}
	defer rows.Close()

	var archives []domain.ExamArchive
	for rows.Next() {
		var archive domain.ExamArchive
		err := rows.Scan(
			&archive.ID,
			&archive.CourseID,
			&archive.Title,
			&archive.Description,
			&archive.ExamType,
			&archive.Year,
			&archive.FileURL,
			&archive.FileType,
			&archive.CreatedAt,
			&archive.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan exam archive: %w", err)
		}
		archives = append(archives, archive)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating exam archives: %w", err)
	}

	return archives, nil
}

func (r *examArchiveRepository) GetByID(ctx context.Context, id int) (*domain.ExamArchive, error) {
	query := `
		SELECT id, course_id, title, description, exam_type, year, file_url, file_type, created_at, updated_at
		FROM exam_archives
		WHERE id = $1
	`
	var archive domain.ExamArchive
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&archive.ID,
		&archive.CourseID,
		&archive.Title,
		&archive.Description,
		&archive.ExamType,
		&archive.Year,
		&archive.FileURL,
		&archive.FileType,
		&archive.CreatedAt,
		&archive.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("exam archive not found")
		}
		return nil, fmt.Errorf("failed to get exam archive: %w", err)
	}
	return &archive, nil
}

func (r *examArchiveRepository) Update(ctx context.Context, archive *domain.ExamArchive) error {
	query := `
		UPDATE exam_archives
		SET title = $1, description = $2, exam_type = $3, year = $4, file_url = $5, file_type = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING updated_at
	`
	return r.db.QueryRowContext(
		ctx,
		query,
		archive.Title,
		archive.Description,
		archive.ExamType,
		archive.Year,
		archive.FileURL,
		archive.FileType,
		archive.ID,
	).Scan(&archive.UpdatedAt)
}

func (r *examArchiveRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM exam_archives WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete exam archive: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("exam archive not found")
	}
	return nil
}
