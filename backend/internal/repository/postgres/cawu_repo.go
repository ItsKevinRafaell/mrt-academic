package postgres

import (
	"database/sql"
	"fmt"
	"mrt-backend/internal/domain"
)

type CawuRepo struct {
	db *sql.DB
}

func NewCawuRepo(db *sql.DB) *CawuRepo {
	return &CawuRepo{db: db}
}

func (r *CawuRepo) Create(cawu *domain.Cawu) error {
	query := `
		INSERT INTO cawu (name, year, semester, is_active)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, cawu.Name, cawu.Year, cawu.Semester, cawu.IsActive).
		Scan(&cawu.ID, &cawu.CreatedAt, &cawu.UpdatedAt)
}

func (r *CawuRepo) GetAll() ([]domain.Cawu, error) {
	query := `
		SELECT id, name, year, semester, is_active, created_at, updated_at
		FROM cawu
		ORDER BY year DESC, semester DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cawus []domain.Cawu
	for rows.Next() {
		var c domain.Cawu
		if err := rows.Scan(&c.ID, &c.Name, &c.Year, &c.Semester, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		cawus = append(cawus, c)
	}
	return cawus, rows.Err()
}

func (r *CawuRepo) GetByID(id int) (*domain.Cawu, error) {
	query := `
		SELECT id, name, year, semester, is_active, created_at, updated_at
		FROM cawu
		WHERE id = $1
	`
	var c domain.Cawu
	err := r.db.QueryRow(query, id).Scan(&c.ID, &c.Name, &c.Year, &c.Semester, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("cawu not found")
	}
	return &c, err
}

func (r *CawuRepo) GetActive() (*domain.Cawu, error) {
	query := `
		SELECT id, name, year, semester, is_active, created_at, updated_at
		FROM cawu
		WHERE is_active = true
		LIMIT 1
	`
	var c domain.Cawu
	err := r.db.QueryRow(query).Scan(&c.ID, &c.Name, &c.Year, &c.Semester, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &c, err
}

func (r *CawuRepo) SetActive(id int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Deactivate all cawus
	if _, err := tx.Exec("UPDATE cawu SET is_active = false"); err != nil {
		return err
	}

	// Activate the specified cawu
	result, err := tx.Exec("UPDATE cawu SET is_active = true WHERE id = $1", id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("cawu not found")
	}

	return tx.Commit()
}

func (r *CawuRepo) Update(cawu *domain.Cawu) error {
	query := `
		UPDATE cawu
		SET name = $1, year = $2, semester = $3, is_active = $4, updated_at = NOW()
		WHERE id = $5
	`
	result, err := r.db.Exec(query, cawu.Name, cawu.Year, cawu.Semester, cawu.IsActive, cawu.ID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("cawu not found")
	}
	return nil
}

func (r *CawuRepo) Delete(id int) error {
	result, err := r.db.Exec("DELETE FROM cawu WHERE id = $1", id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("cawu not found")
	}
	return nil
}
