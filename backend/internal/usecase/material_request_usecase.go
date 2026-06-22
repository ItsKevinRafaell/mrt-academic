package usecase

import (
	"errors"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
)

type MaterialRequestUseCase struct {
	requestRepo *postgres.MaterialRequestRepo
	sharedRepo  *postgres.SharedMaterialRepo
	materialRepo *postgres.MaterialRepo
}

func NewMaterialRequestUseCase(
	requestRepo *postgres.MaterialRequestRepo,
	sharedRepo *postgres.SharedMaterialRepo,
	materialRepo *postgres.MaterialRepo,
) *MaterialRequestUseCase {
	return &MaterialRequestUseCase{
		requestRepo:  requestRepo,
		sharedRepo:   sharedRepo,
		materialRepo: materialRepo,
	}
}

func (uc *MaterialRequestUseCase) CreateRequest(input domain.CreateMaterialRequestInput) (*domain.MaterialRequest, error) {
	_, sourceCourse, err := uc.materialRepo.GetByIDWithCourse(input.MaterialID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	if sourceCourse != nil && sourceCourse.ID == input.RequestingCourseID {
		return nil, errors.New("cannot request materials from your own course")
	}

	exists, _, err := uc.requestRepo.ExistsPending(input.RequestingCourseID, input.MaterialID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("request already exists for this material")
	}

	shared, err := uc.sharedRepo.ExistsShared(input.MaterialID, input.RequestingCourseID)
	if err != nil {
		return nil, err
	}
	if shared {
		return nil, errors.New("material is already shared to this course")
	}

	req := &domain.MaterialRequest{
		RequestingCourseID: input.RequestingCourseID,
		RequestedBy:        input.RequestedBy,
		Purpose:            input.Purpose,
		MaterialID:         input.MaterialID,
		Status:             domain.RequestStatusPending,
		IsActive:           true,
	}

	if err := uc.requestRepo.Create(req); err != nil {
		return nil, err
	}

	return req, nil
}

func (uc *MaterialRequestUseCase) ReviewRequest(requestID int, input domain.ReviewMaterialRequestInput) (*domain.MaterialRequest, error) {
	req, err := uc.requestRepo.GetByID(requestID)
	if err != nil {
		return nil, err
	}

	if req.Status != domain.RequestStatusPending {
		return nil, errors.New("request is not pending")
	}

	var status domain.MaterialRequestStatus
	switch input.Status {
	case "approved":
		status = domain.RequestStatusApproved
		material, sourceCourse, err := uc.materialRepo.GetByIDWithCourse(req.MaterialID)
		if err != nil {
			return nil, err
		}
		sourceCourseID := 0
		if sourceCourse != nil {
			sourceCourseID = sourceCourse.ID
		}

		sm := &domain.SharedMaterial{
			RequestID:      req.ID,
			MaterialID:     req.MaterialID,
			TargetCourseID: req.RequestingCourseID,
			SourceCourseID: sourceCourseID,
			SharedBy:       input.ReviewedBy,
		}
		if err := uc.sharedRepo.Create(sm); err != nil {
			return nil, err
		}
		_ = material
	case "rejected":
		status = domain.RequestStatusRejected
	default:
		return nil, errors.New("invalid status, must be 'approved' or 'rejected'")
	}

	req.ReviewedBy = &input.ReviewedBy
	req.Status = status
	req.ReviewNote = input.ReviewNote

	if err := uc.requestRepo.UpdateReview(req); err != nil {
		return nil, err
	}

	return req, nil
}

func (uc *MaterialRequestUseCase) GetRequest(requestID int) (*domain.MaterialRequestWithDetails, error) {
	req, err := uc.requestRepo.GetByID(requestID)
	if err != nil {
		return nil, err
	}

	material, sourceCourse, err := uc.materialRepo.GetByIDWithCourse(req.MaterialID)
	if err != nil {
		return nil, err
	}

	return &domain.MaterialRequestWithDetails{
		MaterialRequest: *req,
		Material:        material,
		SourceCourse:    sourceCourse,
	}, nil
}

func (uc *MaterialRequestUseCase) ListRequests(filter domain.MaterialRequestFilter) ([]domain.MaterialRequestWithDetails, error) {
	return uc.requestRepo.List(filter)
}

func (uc *MaterialRequestUseCase) GetPendingCount() (int, error) {
	return uc.requestRepo.CountPending()
}

func (uc *MaterialRequestUseCase) GetSharedMaterials(courseID int) ([]domain.SharedMaterialWithDetails, error) {
	return uc.sharedRepo.GetByTargetCourse(courseID)
}

func (uc *MaterialRequestUseCase) BrowseAvailableMaterials(courseID int) ([]domain.AvailableMaterial, error) {
	return nil, nil
}
