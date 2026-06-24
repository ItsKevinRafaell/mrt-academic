package handler

import (
	"mrt-backend/internal/domain"
	"mrt-backend/internal/usecase"
)

type stubCourseUsecase struct {
	courses []domain.Course
	err     error
}

func newStubCourseUsecase(courses []domain.Course, err error) *usecase.CourseUsecase {
	stub := &stubCourseUsecase{courses: courses, err: err}
	return usecase.NewCourseUsecase(stub, &stubSessionRepo{}, &stubMaterialRepo{}, &stubTaskRepo{})
}

func (s *stubCourseUsecase) Create(course *domain.Course) error {
	if course.Code == "" || course.Name == "" || course.SKS <= 0 {
		return domain.ErrValidation
	}
	course.ID = 1
	return nil
}

func (s *stubCourseUsecase) GetAll(page, limit int, cawuID int) ([]domain.Course, int, error) {
	return s.courses, len(s.courses), s.err
}

func (s *stubCourseUsecase) GetByID(id int) (*domain.Course, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, c := range s.courses {
		if c.ID == id {
			return &c, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (s *stubCourseUsecase) Update(course *domain.Course) error {
	return nil
}

func (s *stubCourseUsecase) Delete(id int) error {
	return nil
}

type stubSessionRepo struct{}

func (s *stubSessionRepo) Create(session *domain.Session) error { return nil }
func (s *stubSessionRepo) GetByCourseID(courseID int, page, limit int) ([]domain.Session, int, error) {
	return nil, 0, nil
}
func (s *stubSessionRepo) GetByID(id int) (*domain.Session, error) { return nil, nil }
func (s *stubSessionRepo) Update(session *domain.Session) error    { return nil }
func (s *stubSessionRepo) Delete(id int) error                     { return nil }

type stubMaterialRepo struct{}

func (s *stubMaterialRepo) Create(material *domain.Material) error { return nil }
func (s *stubMaterialRepo) GetBySessionID(sessionID int) ([]domain.Material, error) {
	return nil, nil
}
func (s *stubMaterialRepo) GetByCourseID(courseID int) ([]domain.SessionWithMaterials, error) {
	return nil, nil
}
func (s *stubMaterialRepo) GetByTopicID(topicID int) ([]domain.Material, error) {
	return nil, nil
}
func (s *stubMaterialRepo) GetByID(id int) (*domain.Material, error) { return nil, nil }
func (s *stubMaterialRepo) Update(material *domain.Material) error   { return nil }
func (s *stubMaterialRepo) Delete(id int) error                      { return nil }

type stubTaskRepo struct{}

func (s *stubTaskRepo) Create(task *domain.Task) error { return nil }
func (s *stubTaskRepo) GetByCourseID(courseID int, page, limit int) ([]domain.Task, int, error) {
	return nil, 0, nil
}
func (s *stubTaskRepo) GetByID(id int) (*domain.Task, error) { return nil, nil }
func (s *stubTaskRepo) Update(task *domain.Task) error       { return nil }
func (s *stubTaskRepo) Delete(id int) error                  { return nil }
func (s *stubTaskRepo) UpdateProgress(progress *domain.TaskProgress) error {
	return nil
}
func (s *stubTaskRepo) GetProgressByUserID(userID string) ([]domain.TaskProgress, error) {
	return nil, nil
}
func (s *stubTaskRepo) GetProgressByTaskID(taskID int) ([]domain.TaskProgress, error) {
	return nil, nil
}
func (s *stubTaskRepo) GetProgressWithUsersByTaskID(taskID int) ([]domain.TaskProgressWithUser, error) {
	return nil, nil
}
func (s *stubTaskRepo) GetTotalUserCount() (int, error) { return 0, nil }
func (s *stubTaskRepo) GetTaskDetail(taskID int) (*domain.TaskDetailResponse, error) {
	return nil, nil
}
