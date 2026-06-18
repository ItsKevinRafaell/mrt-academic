package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"

	"github.com/lib/pq"
)

type UserRepo struct {
	db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(user *domain.User) error {
	query := `
		INSERT INTO users (nim, full_name, email, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	err := r.db.QueryRow(query, user.NIM, user.FullName, user.Email, user.PasswordHash).
		Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return domain.ErrAlreadyExists
	}
	return err
}

func (r *UserRepo) GetByEmail(email string) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, nim, full_name, email, password_hash, created_at, updated_at
		FROM users WHERE email = $1`

	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.NIM, &user.FullName, &user.Email,
		&user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return user, err
}

func (r *UserRepo) GetByID(id string) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, nim, full_name, email, password_hash, created_at, updated_at
		FROM users WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.NIM, &user.FullName, &user.Email,
		&user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return user, err
}

func (r *UserRepo) GetAll() ([]domain.User, error) {
	query := `SELECT id, nim, full_name, email, password_hash, created_at, updated_at
		FROM users ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		user := domain.User{}
		err := rows.Scan(
			&user.ID, &user.NIM, &user.FullName, &user.Email,
			&user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}
