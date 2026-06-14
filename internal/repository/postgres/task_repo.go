package postgres

import (
	"database/sql"
	"errors"
	"mrt-backend/internal/domain"
)

type TaskRepo struct {
	db *sql.DB
}

func NewTaskRepo(db *sql.DB) *TaskRepo {
	return &TaskRepo{db: db}
}

func (r *TaskRepo) Create(task *domain.Task) error {
	query := `INSERT INTO tasks (course_id, title, description, deadline)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(query, task.CourseID, task.Title, task.Description, task.Deadline).
		Scan(&task.ID, &task.CreatedAt, &task.UpdatedAt)
}

func (r *TaskRepo) GetByCourseID(courseID int) ([]domain.Task, error) {
	query := `SELECT id, course_id, title, description, deadline, created_at, updated_at
		FROM tasks WHERE course_id = $1 ORDER BY deadline`

	rows, err := r.db.Query(query, courseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []domain.Task
	for rows.Next() {
		var t domain.Task
		if err := rows.Scan(&t.ID, &t.CourseID, &t.Title, &t.Description,
			&t.Deadline, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (r *TaskRepo) GetByID(id int) (*domain.Task, error) {
	t := &domain.Task{}
	query := `SELECT id, course_id, title, description, deadline, created_at, updated_at
		FROM tasks WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&t.ID, &t.CourseID, &t.Title, &t.Description,
		&t.Deadline, &t.CreatedAt, &t.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return t, err
}

func (r *TaskRepo) Update(task *domain.Task) error {
	query := `UPDATE tasks SET title = $1, description = $2, deadline = $3, updated_at = NOW()
		WHERE id = $4 RETURNING updated_at`

	err := r.db.QueryRow(query, task.Title, task.Description, task.Deadline, task.ID).
		Scan(&task.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	return err
}

func (r *TaskRepo) Delete(id int) error {
	result, err := r.db.Exec(`DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TaskRepo) UpdateProgress(p *domain.TaskProgress) error {
	query := `INSERT INTO task_progress (user_id, task_id, completed, completed_at)
		VALUES ($1, $2, $3, CASE WHEN $3 = true THEN NOW() ELSE NULL END)
		ON CONFLICT (user_id, task_id)
		DO UPDATE SET completed = $3, completed_at = CASE WHEN $3 = true THEN NOW() ELSE NULL END`
	_, err := r.db.Exec(query, p.UserID, p.TaskID, p.Completed)
	return err
}

func (r *TaskRepo) GetProgressByUserID(userID string) ([]domain.TaskProgress, error) {
	query := `SELECT user_id, task_id, completed, completed_at
		FROM task_progress WHERE user_id = $1`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progress []domain.TaskProgress
	for rows.Next() {
		var p domain.TaskProgress
		if err := rows.Scan(&p.UserID, &p.TaskID, &p.Completed, &p.CompletedAt); err != nil {
			return nil, err
		}
		progress = append(progress, p)
	}
	return progress, rows.Err()
}

func (r *TaskRepo) GetProgressByTaskID(taskID int) ([]domain.TaskProgress, error) {
	query := `SELECT user_id, task_id, completed, completed_at
		FROM task_progress WHERE task_id = $1`

	rows, err := r.db.Query(query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progress []domain.TaskProgress
	for rows.Next() {
		var p domain.TaskProgress
		if err := rows.Scan(&p.UserID, &p.TaskID, &p.Completed, &p.CompletedAt); err != nil {
			return nil, err
		}
		progress = append(progress, p)
	}
	return progress, rows.Err()
}
