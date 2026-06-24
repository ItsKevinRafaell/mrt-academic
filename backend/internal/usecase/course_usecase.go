package usecase

import (
	"context"
	"mrt-backend/internal/domain"
)

type CourseUsecase struct {
	courseRepo   domain.CourseRepository
	sessionRepo  domain.SessionRepository
	materialRepo domain.MaterialRepository
	taskRepo     domain.TaskRepository
}

func NewCourseUsecase(
	courseRepo domain.CourseRepository,
	sessionRepo domain.SessionRepository,
	materialRepo domain.MaterialRepository,
	taskRepo domain.TaskRepository,
) *CourseUsecase {
	return &CourseUsecase{
		courseRepo:   courseRepo,
		sessionRepo:  sessionRepo,
		materialRepo: materialRepo,
		taskRepo:     taskRepo,
	}
}

func (uc *CourseUsecase) Create(ctx context.Context, c *domain.Course) error {
	if c.Code == "" || c.Name == "" || c.SKS <= 0 {
		return domain.ErrValidation
	}
	return uc.courseRepo.Create(c)
}

func (uc *CourseUsecase) GetAll(ctx context.Context, page, limit int, cawuID int) ([]domain.Course, domain.Pagination, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	courses, total, err := uc.courseRepo.GetAll(page, limit, cawuID)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return courses, domain.Pagination{Page: page, PerPage: limit, Total: total}, nil
}

func (uc *CourseUsecase) GetByID(ctx context.Context, id int) (*domain.Course, error) {
	return uc.courseRepo.GetByID(id)
}

func (uc *CourseUsecase) Update(ctx context.Context, c *domain.Course) error {
	if c.Code == "" || c.Name == "" || c.SKS <= 0 {
		return domain.ErrValidation
	}
	return uc.courseRepo.Update(c)
}

func (uc *CourseUsecase) Delete(ctx context.Context, id int) error {
	return uc.courseRepo.Delete(id)
}

func (uc *CourseUsecase) CreateSession(ctx context.Context, s *domain.Session) error {
	if s.Title == "" || s.Number <= 0 {
		return domain.ErrValidation
	}
	if _, err := uc.courseRepo.GetByID(s.CourseID); err != nil {
		return err
	}
	return uc.sessionRepo.Create(s)
}

func (uc *CourseUsecase) GetSessions(ctx context.Context, courseID int, page, limit int) ([]domain.Session, domain.Pagination, error) {
	if _, err := uc.courseRepo.GetByID(courseID); err != nil {
		return nil, domain.Pagination{}, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	sessions, total, err := uc.sessionRepo.GetByCourseID(courseID, page, limit)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return sessions, domain.Pagination{Page: page, PerPage: limit, Total: total}, nil
}

func (uc *CourseUsecase) GetSessionByID(ctx context.Context, id int) (*domain.Session, error) {
	return uc.sessionRepo.GetByID(id)
}

func (uc *CourseUsecase) UpdateSession(ctx context.Context, s *domain.Session) error {
	if s.Title == "" || s.Number <= 0 {
		return domain.ErrValidation
	}
	return uc.sessionRepo.Update(s)
}

func (uc *CourseUsecase) DeleteSession(ctx context.Context, id int) error {
	return uc.sessionRepo.Delete(id)
}

func (uc *CourseUsecase) GetMaterialsByCourse(ctx context.Context, courseID int) ([]domain.SessionWithMaterials, error) {
	if _, err := uc.courseRepo.GetByID(courseID); err != nil {
		return nil, err
	}
	return uc.materialRepo.GetByCourseID(courseID)
}

func (uc *CourseUsecase) GetMaterialsBySession(ctx context.Context, sessionID int) ([]domain.Material, error) {
	return uc.materialRepo.GetBySessionID(sessionID)
}

func (uc *CourseUsecase) CreateMaterial(ctx context.Context, m *domain.Material) error {
	if m.Title == "" || m.Type == "" || m.URL == "" {
		return domain.ErrValidation
	}
	if m.SessionID != nil {
		if _, err := uc.sessionRepo.GetByID(*m.SessionID); err != nil {
			return err
		}
	} else if m.TopicID != nil {
	} else {
		return domain.ErrValidation
	}
	return uc.materialRepo.Create(m)
}

func (uc *CourseUsecase) UpdateMaterial(ctx context.Context, m *domain.Material) error {
	if m.Title == "" || m.Type == "" || m.URL == "" {
		return domain.ErrValidation
	}
	return uc.materialRepo.Update(m)
}

func (uc *CourseUsecase) GetMaterialsByTopic(ctx context.Context, topicID int) ([]domain.Material, error) {
	return uc.materialRepo.GetByTopicID(topicID)
}

func (uc *CourseUsecase) CreateMaterialForTopic(ctx context.Context, m *domain.Material) error {
	if m.Title == "" || m.Type == "" || m.URL == "" {
		return domain.ErrValidation
	}
	if m.TopicID == nil {
		return domain.ErrValidation
	}
	return uc.materialRepo.Create(m)
}

func (uc *CourseUsecase) DeleteMaterial(ctx context.Context, id int) error {
	return uc.materialRepo.Delete(id)
}

func (uc *CourseUsecase) CreateTask(ctx context.Context, t *domain.Task) error {
	if t.Title == "" || t.Deadline.IsZero() {
		return domain.ErrValidation
	}
	if _, err := uc.courseRepo.GetByID(t.CourseID); err != nil {
		return err
	}
	return uc.taskRepo.Create(t)
}

func (uc *CourseUsecase) GetTasks(ctx context.Context, courseID int, page, limit int) ([]domain.Task, domain.Pagination, error) {
	if _, err := uc.courseRepo.GetByID(courseID); err != nil {
		return nil, domain.Pagination{}, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	tasks, total, err := uc.taskRepo.GetByCourseID(courseID, page, limit)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return tasks, domain.Pagination{Page: page, PerPage: limit, Total: total}, nil
}

func (uc *CourseUsecase) UpdateTask(ctx context.Context, t *domain.Task) error {
	if t.Title == "" || t.Deadline.IsZero() {
		return domain.ErrValidation
	}
	return uc.taskRepo.Update(t)
}

func (uc *CourseUsecase) DeleteTask(ctx context.Context, id int) error {
	return uc.taskRepo.Delete(id)
}

func (uc *CourseUsecase) UpdateTaskProgress(ctx context.Context, p *domain.TaskProgress) error {
	if _, err := uc.taskRepo.GetByID(p.TaskID); err != nil {
		return err
	}
	return uc.taskRepo.UpdateProgress(p)
}
