package usecase

import (
	"errors"
	"mrt-backend/internal/domain"
)

type questionUseCase struct {
	questionRepo   domain.QuestionRepository
	submissionRepo domain.ExamSubmissionRepository
}

func NewQuestionUsecase(
	questionRepo domain.QuestionRepository,
	submissionRepo domain.ExamSubmissionRepository,
) domain.QuestionUseCase {
	return &questionUseCase{
		questionRepo:   questionRepo,
		submissionRepo: submissionRepo,
	}
}

func (uc *questionUseCase) Create(question *domain.Question) error {
	if question.CourseID == 0 {
		return errors.New("course_id is required")
	}
	if question.Title == "" {
		return errors.New("title is required")
	}
	if question.QuestionText == "" {
		return errors.New("question_text is required")
	}
	if question.Type != domain.QuestionTypeRegular && question.Type != domain.QuestionTypeExam {
		return errors.New("type must be 'regular' or 'exam'")
	}
	if question.DifficultyLevel != domain.DifficultyEasy &&
		question.DifficultyLevel != domain.DifficultyMedium &&
		question.DifficultyLevel != domain.DifficultyHard {
		return errors.New("difficulty_level must be 'easy', 'medium', or 'hard'")
	}

	if question.Type == domain.QuestionTypeExam {
		if question.TimeLimitMin == nil || *question.TimeLimitMin <= 0 {
			return errors.New("time_limit_minutes is required for exam questions")
		}
		if len(question.Options) == 0 {
			return errors.New("options are required for exam questions")
		}
		if question.AnswerKey == nil || *question.AnswerKey == "" {
			return errors.New("answer_key is required for exam questions")
		}
	}

	if question.Type == domain.QuestionTypeRegular {
		if question.ExternalURL == nil || *question.ExternalURL == "" {
			return errors.New("external_url is required for regular questions")
		}
	}

	return uc.questionRepo.Create(question)
}

func (uc *questionUseCase) GetByID(id int) (*domain.Question, error) {
	return uc.questionRepo.GetByID(id)
}

func (uc *questionUseCase) GetByCourseID(courseID int) ([]*domain.Question, error) {
	return uc.questionRepo.GetByCourseID(courseID)
}

func (uc *questionUseCase) GetBySessionID(sessionID int) ([]*domain.Question, error) {
	return uc.questionRepo.GetBySessionID(sessionID)
}

func (uc *questionUseCase) Update(question *domain.Question) error {
	if question.ID == 0 {
		return errors.New("id is required")
	}

	existing, err := uc.questionRepo.GetByID(question.ID)
	if err != nil {
		return err
	}

	if question.Title == "" {
		question.Title = existing.Title
	}
	if question.QuestionText == "" {
		question.QuestionText = existing.QuestionText
	}
	if question.Type == "" {
		question.Type = existing.Type
	}
	if question.DifficultyLevel == "" {
		question.DifficultyLevel = existing.DifficultyLevel
	}
	if question.CourseID == 0 {
		question.CourseID = existing.CourseID
	}

	return uc.questionRepo.Update(question)
}

func (uc *questionUseCase) Delete(id int) error {
	return uc.questionRepo.Delete(id)
}

func (uc *questionUseCase) SubmitExam(submission *domain.ExamSubmission) error {
	if submission.UserID == "" {
		return errors.New("user_id is required")
	}
	if submission.QuestionID == 0 {
		return errors.New("question_id is required")
	}
	if len(submission.Answers) == 0 {
		return errors.New("answers are required")
	}

	question, err := uc.questionRepo.GetByID(submission.QuestionID)
	if err != nil {
		return err
	}

	if question.Type != domain.QuestionTypeExam {
		return errors.New("can only submit answers for exam questions")
	}

	if question.AnswerKey != nil && *question.AnswerKey != "" {
		correctCount := 0
		for _, answer := range submission.Answers {
			if answer.IsSelected && answer.OptionKey == *question.AnswerKey {
				correctCount++
			}
		}
		submission.Score = &correctCount
	}

	return uc.submissionRepo.Create(submission)
}

func (uc *questionUseCase) GetSubmissionsByUser(userID string) ([]*domain.ExamSubmission, error) {
	return uc.submissionRepo.GetByUserID(userID)
}

func (uc *questionUseCase) GetSubmissionsByQuestion(questionID int) ([]*domain.ExamSubmission, error) {
	return uc.submissionRepo.GetByQuestionID(questionID)
}
