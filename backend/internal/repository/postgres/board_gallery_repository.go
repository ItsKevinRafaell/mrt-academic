package postgres

import (
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
	"strings"
)

type boardGalleryRepository struct {
	db *sql.DB
}

func NewBoardGalleryRepository(db *sql.DB) domain.BoardGalleryRepository {
	return &boardGalleryRepository{db: db}
}

func (r *boardGalleryRepository) Create(item *domain.BoardGallery) error {
	query := `
		INSERT INTO board_gallery (
			session_id, uploaded_by, title, description, image_url,
			ocr_text, tags, order_number, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	tagsArray := "{" + strings.Join(item.Tags, ",") + "}"

	err := r.db.QueryRow(
		query,
		item.SessionID,
		item.UploadedBy,
		item.Title,
		item.Description,
		item.ImageURL,
		item.OCRText,
		tagsArray,
		item.OrderNumber,
		item.IsActive,
	).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create board gallery item: %w", err)
	}

	return nil
}

func (r *boardGalleryRepository) GetBySessionID(sessionID int) ([]domain.BoardGallery, error) {
	query := `
		SELECT id, session_id, uploaded_by, title, description, image_url,
			ocr_text, tags, order_number, is_active, created_at, updated_at
		FROM board_gallery
		WHERE session_id = $1 AND is_active = true
		ORDER BY order_number, created_at DESC
	`

	rows, err := r.db.Query(query, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to query board gallery: %w", err)
	}
	defer rows.Close()

	var items []domain.BoardGallery
	for rows.Next() {
		var item domain.BoardGallery
		var tagsArray string

		err := rows.Scan(
			&item.ID,
			&item.SessionID,
			&item.UploadedBy,
			&item.Title,
			&item.Description,
			&item.ImageURL,
			&item.OCRText,
			&tagsArray,
			&item.OrderNumber,
			&item.IsActive,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan board gallery: %w", err)
		}

		// Parse tags array
		if tagsArray != "" && tagsArray != "{}" {
			tagsArray = strings.Trim(tagsArray, "{}")
			item.Tags = strings.Split(tagsArray, ",")
		}

		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating board gallery rows: %w", err)
	}

	return items, nil
}

func (r *boardGalleryRepository) GetByID(id int) (*domain.BoardGallery, error) {
	query := `
		SELECT id, session_id, uploaded_by, title, description, image_url,
			ocr_text, tags, order_number, is_active, created_at, updated_at
		FROM board_gallery
		WHERE id = $1
	`

	var item domain.BoardGallery
	var tagsArray string

	err := r.db.QueryRow(query, id).Scan(
		&item.ID,
		&item.SessionID,
		&item.UploadedBy,
		&item.Title,
		&item.Description,
		&item.ImageURL,
		&item.OCRText,
		&tagsArray,
		&item.OrderNumber,
		&item.IsActive,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get board gallery item: %w", err)
	}

	// Parse tags array
	if tagsArray != "" && tagsArray != "{}" {
		tagsArray = strings.Trim(tagsArray, "{}")
		item.Tags = strings.Split(tagsArray, ",")
	}

	return &item, nil
}

func (r *boardGalleryRepository) Update(item *domain.BoardGallery) error {
	query := `
		UPDATE board_gallery
		SET title = $1, description = $2, image_url = $3,
			ocr_text = $4, tags = $5, order_number = $6, is_active = $7
		WHERE id = $8
		RETURNING updated_at
	`

	tagsArray := "{" + strings.Join(item.Tags, ",") + "}"

	err := r.db.QueryRow(
		query,
		item.Title,
		item.Description,
		item.ImageURL,
		item.OCRText,
		tagsArray,
		item.OrderNumber,
		item.IsActive,
		item.ID,
	).Scan(&item.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update board gallery item: %w", err)
	}

	return nil
}

func (r *boardGalleryRepository) Delete(id int) error {
	query := `
		UPDATE board_gallery
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete board gallery item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("board gallery item not found")
	}

	return nil
}

func (r *boardGalleryRepository) Reorder(id int, orderNumber int) error {
	query := `
		UPDATE board_gallery
		SET order_number = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.db.Exec(query, orderNumber, id)
	if err != nil {
		return fmt.Errorf("failed to reorder board gallery item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("board gallery item not found")
	}

	return nil
}
