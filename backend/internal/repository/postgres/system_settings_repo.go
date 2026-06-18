package postgres

import (
	"database/sql"
)

type SystemSettingsRepo struct {
	db *sql.DB
}

func NewSystemSettingsRepo(db *sql.DB) *SystemSettingsRepo {
	return &SystemSettingsRepo{db: db}
}

func (r *SystemSettingsRepo) Get(key string) (string, error) {
	query := `SELECT value FROM system_settings WHERE key = $1`
	var value string
	err := r.db.QueryRow(query, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

func (r *SystemSettingsRepo) Set(key, value string) error {
	query := `
		INSERT INTO system_settings (key, value)
		VALUES ($1, $2)
		ON CONFLICT (key)
		DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
	`
	_, err := r.db.Exec(query, key, value)
	return err
}

func (r *SystemSettingsRepo) Delete(key string) error {
	_, err := r.db.Exec("DELETE FROM system_settings WHERE key = $1", key)
	return err
}
