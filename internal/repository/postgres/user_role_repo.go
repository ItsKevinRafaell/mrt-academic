package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
)

type UserRoleRepo struct {
	db *sql.DB
}

func NewUserRoleRepo(db *sql.DB) *UserRoleRepo {
	return &UserRoleRepo{db: db}
}

func (r *UserRoleRepo) Assign(ur *domain.UserRole) error {
	query := `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
		ON CONFLICT (user_id, role) DO NOTHING`
	_, err := r.db.Exec(query, ur.UserID, ur.Role)
	return err
}

func (r *UserRoleRepo) GetByUserID(userID string) ([]domain.UserRole, error) {
	query := `SELECT user_id, role, assigned_at FROM user_roles WHERE user_id = $1`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []domain.UserRole
	for rows.Next() {
		var ur domain.UserRole
		if err := rows.Scan(&ur.UserID, &ur.Role, &ur.AssignedAt); err != nil {
			return nil, err
		}
		roles = append(roles, ur)
	}
	return roles, rows.Err()
}

func (r *UserRoleRepo) GetPrimaryRole(userID string) (string, error) {
	query := `SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1`
	var role string
	err := r.db.QueryRow(query, userID).Scan(&role)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.RoleMahasiswa, nil
	}
	return role, err
}
