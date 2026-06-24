package http

import (
	"database/sql"
	"log"
	"mrt-backend/internal/config"
	"mrt-backend/internal/delivery/http/handler"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/domain"
	"mrt-backend/internal/repository/postgres"
	"mrt-backend/internal/usecase"
	"net/http"
	"os"
)

type Router struct {
	mux                     *http.ServeMux
	db                      *sql.DB
	authUsecase             *usecase.AuthUsecase
	userUsecase             *usecase.UserUseCase
	courseUsecase           *usecase.CourseUsecase
	taskUsecase             *usecase.TaskUseCase
	gradeUsecase            *usecase.GradeUsecase
	gradeComponentUsecase   *usecase.GradeComponentUsecase
	eventUsecase            *usecase.EventUsecase
	dashboardUsecase        *usecase.DashboardUsecase
	searchUsecase           *usecase.SearchUsecase
	questionUsecase         domain.QuestionUseCase
	topicUsecase            *usecase.TopicUseCase
	excelUsecase            *usecase.ExcelUsecase
	cawuUsecase             *usecase.CawuUsecase
	scheduleUsecase         *usecase.ScheduleUsecase
	calendarUsecase         *usecase.CalendarUsecase
	boardGalleryUsecase     *usecase.BoardGalleryUsecase
	bankSoalUsecase         *usecase.BankSoalUsecase
	gcalUsecase             *usecase.GoogleCalendarUsecase
	fonnteService           *usecase.FonnteService
	authMiddleware          *middleware.AuthMiddleware
	corsMiddleware          *middleware.CORSMiddleware
	compressionMiddleware   *middleware.CompressionMiddleware
	rateLimiter             *middleware.RateLimiter
}

func NewRouter(cfg *config.Config, db *sql.DB) *Router {
	userRepo := postgres.NewUserRepo(db)
	userRoleRepo := postgres.NewUserRoleRepo(db)
	courseRepo := postgres.NewCourseRepo(db)
	sessionRepo := postgres.NewSessionRepo(db)
	materialRepo := postgres.NewMaterialRepo(db)
	taskRepo := postgres.NewTaskRepo(db)
	gradeRepo := postgres.NewGradeRepo(db)
	gradeComponentRepo := postgres.NewGradeComponentRepo(db)
	eventRepo := postgres.NewEventRepo(db)
	dashboardRepo := postgres.NewDashboardRepo(db)
	searchRepo := postgres.NewSearchRepo(db, cfg.SearchCacheTTL)
	questionRepo := postgres.NewQuestionRepo(db)
	examSubmissionRepo := postgres.NewExamSubmissionRepo(db)
	topicRepo := postgres.NewTopicRepository(db)
	cawuRepo := postgres.NewCawuRepo(db)
	settingsRepo := postgres.NewSystemSettingsRepo(db)
	examArchiveRepo := postgres.NewExamArchiveRepository(db)
	simulationRepo := postgres.NewSimulationRepository(db)
	simulationQuestionRepo := postgres.NewSimulationQuestionRepository(db)

	authUsecase := usecase.NewAuthUsecase(userRepo, userRoleRepo, cfg.JWTSecret)
	userUsecase := usecase.NewUserUseCase(userRepo, userRoleRepo)
	courseUsecase := usecase.NewCourseUsecase(courseRepo, sessionRepo, materialRepo, taskRepo)
	taskUsecase := usecase.NewTaskUseCase(taskRepo)
	gradeUsecase := usecase.NewGradeUsecase(gradeRepo)
	gradeComponentUsecase := usecase.NewGradeComponentUsecase(gradeComponentRepo)
	eventUsecase := usecase.NewEventUsecase(eventRepo)
	dashboardUsecase := usecase.NewDashboardUsecase(dashboardRepo)
	searchUsecase := usecase.NewSearchUsecase(searchRepo, cfg.SearchCacheTTL)
	questionUsecase := usecase.NewQuestionUsecase(questionRepo, examSubmissionRepo)
	topicUsecase := usecase.NewTopicUseCase(topicRepo, sessionRepo, materialRepo)
	excelUsecase := usecase.NewExcelUsecase(courseRepo, sessionRepo, materialRepo, gradeUsecase)
	cawuUsecase := usecase.NewCawuUsecase(cawuRepo, settingsRepo)
	scheduleRepo := postgres.NewScheduleRepo(db)
	scheduleUsecase := usecase.NewScheduleUsecase(scheduleRepo, courseRepo)
	calendarRepo := postgres.NewCalendarEventRepo(db)
	calendarUsecase := usecase.NewCalendarUsecase(calendarRepo)
	boardGalleryRepo := postgres.NewBoardGalleryRepository(db)
	boardGalleryUsecase := usecase.NewBoardGalleryUsecase(boardGalleryRepo)
	bankSoalUsecase := usecase.NewBankSoalUsecase(examArchiveRepo, simulationRepo, simulationQuestionRepo)
	fonnteToken := os.Getenv("FONNTE_TOKEN")
	fonnteService := usecase.NewFonnteService(fonnteToken)

	return &Router{
		mux:                     http.NewServeMux(),
		db:                      db,
		authUsecase:             authUsecase,
		userUsecase:             userUsecase,
		courseUsecase:           courseUsecase,
		taskUsecase:             taskUsecase,
		gradeUsecase:            gradeUsecase,
		gradeComponentUsecase:   gradeComponentUsecase,
		eventUsecase:            eventUsecase,
		dashboardUsecase:        dashboardUsecase,
		searchUsecase:           searchUsecase,
		questionUsecase:         questionUsecase,
		topicUsecase:            topicUsecase,
		excelUsecase:            excelUsecase,
		cawuUsecase:             cawuUsecase,
		scheduleUsecase:         scheduleUsecase,
		calendarUsecase:         calendarUsecase,
		boardGalleryUsecase:     boardGalleryUsecase,
		bankSoalUsecase:         bankSoalUsecase,
		gcalUsecase:             newGoogleCalendarUsecase(cfg, scheduleRepo, courseRepo),
		fonnteService:           fonnteService,
		authMiddleware:          middleware.NewAuthMiddleware(authUsecase),
		corsMiddleware:          middleware.NewCORSMiddleware(cfg.AllowedOrigins),
		compressionMiddleware:   middleware.NewCompressionMiddleware(),
		rateLimiter:             middleware.NewRateLimiter(),
	}
}

func (r *Router) Setup() {
	healthHandler := handler.NewHealthHandler(r.db)
	docsHandler := handler.NewDocsHandler()
	swaggerHandler := handler.NewSwaggerHandler()
	authHandler := handler.NewAuthHandler(r.authUsecase)
	userHandler := handler.NewUserHandler(r.userUsecase)
	courseHandler := handler.NewCourseHandler(r.courseUsecase)
	taskHandler := handler.NewTaskHandler(r.taskUsecase)
	gradeHandler := handler.NewGradeHandler(r.gradeUsecase)
	gradeComponentHandler := handler.NewGradeComponentHandler(r.gradeComponentUsecase)
	eventHandler := handler.NewEventHandler(r.eventUsecase)
	dashboardHandler := handler.NewDashboardHandler(r.dashboardUsecase)
	searchHandler := handler.NewSearchHandler(r.searchUsecase)
	excelHandler := handler.NewExcelHandler(r.excelUsecase)

	auth := r.authMiddleware.Authenticate
	admin := r.authMiddleware.RequireAdmin()

	r.mux.HandleFunc("GET /api/health", healthHandler.Check)
	r.mux.HandleFunc("GET /api/v1/docs", docsHandler.ServeSpec)
	r.mux.HandleFunc("GET /api/v1/swagger", swaggerHandler.ServeUI)

	r.mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	r.mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)

	r.mux.Handle("GET /api/v1/users/me", auth(http.HandlerFunc(authHandler.GetCurrentUser)))

	r.mux.Handle("GET /api/v1/courses", auth(http.HandlerFunc(courseHandler.List)))
	r.mux.Handle("POST /api/v1/courses", auth(admin(http.HandlerFunc(courseHandler.Create))))
	r.mux.Handle("GET /api/v1/courses/{id}", auth(http.HandlerFunc(courseHandler.GetByID)))
	r.mux.Handle("PUT /api/v1/courses/{id}", auth(admin(http.HandlerFunc(courseHandler.Update))))
	r.mux.Handle("DELETE /api/v1/courses/{id}", auth(admin(http.HandlerFunc(courseHandler.Delete))))

	r.mux.Handle("GET /api/v1/courses/{course_id}/sessions", auth(http.HandlerFunc(courseHandler.ListSessions)))
	r.mux.Handle("GET /api/v1/sessions/{session_id}", auth(http.HandlerFunc(courseHandler.GetSessionByID)))
	r.mux.Handle("GET /api/v1/sessions/{session_id}/materials", auth(http.HandlerFunc(courseHandler.GetMaterialsBySession)))
	r.mux.Handle("POST /api/v1/courses/{course_id}/sessions", auth(admin(http.HandlerFunc(courseHandler.CreateSession))))
	r.mux.Handle("PUT /api/v1/sessions/{session_id}", auth(admin(http.HandlerFunc(courseHandler.UpdateSession))))
	r.mux.Handle("DELETE /api/v1/sessions/{session_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteSession))))

	r.mux.Handle("GET /api/v1/courses/{course_id}/materials", auth(http.HandlerFunc(courseHandler.GetMaterialsByCourse)))
	r.mux.Handle("POST /api/v1/materials", auth(admin(http.HandlerFunc(courseHandler.CreateMaterial))))
	r.mux.Handle("PUT /api/v1/materials/{material_id}", auth(admin(http.HandlerFunc(courseHandler.UpdateMaterial))))
	r.mux.Handle("DELETE /api/v1/materials/{material_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteMaterial))))

	r.mux.Handle("GET /api/v1/courses/{course_id}/tasks", auth(http.HandlerFunc(taskHandler.GetTasksByCourse)))
	r.mux.Handle("POST /api/v1/courses/{course_id}/tasks", auth(admin(http.HandlerFunc(taskHandler.CreateTask))))
	r.mux.Handle("GET /api/v1/tasks/{id}", auth(http.HandlerFunc(taskHandler.GetTaskByID)))
	r.mux.Handle("PUT /api/v1/tasks/{id}", auth(admin(http.HandlerFunc(taskHandler.UpdateTask))))
	r.mux.Handle("DELETE /api/v1/tasks/{id}", auth(admin(http.HandlerFunc(taskHandler.DeleteTask))))
	r.mux.Handle("PATCH /api/v1/tasks/{id}/progress", auth(http.HandlerFunc(taskHandler.UpdateProgress)))
	r.mux.Handle("GET /api/v1/tasks/progress", auth(http.HandlerFunc(taskHandler.GetProgressByUser)))
	r.mux.Handle("GET /api/v1/tasks/{id}/progress", auth(http.HandlerFunc(taskHandler.GetProgressByTask)))
	r.mux.Handle("GET /api/v1/tasks/{id}/monitoring", auth(admin(http.HandlerFunc(taskHandler.GetTaskProgressSummary))))
	r.mux.Handle("GET /api/v1/courses/{course_id}/tasks/monitoring", auth(admin(http.HandlerFunc(taskHandler.GetCourseProgressSummary))))
	r.mux.Handle("GET /api/v1/tasks/{id}/detail", auth(admin(http.HandlerFunc(taskHandler.GetTaskDetail))))

	r.mux.Handle("POST /api/v1/grades", auth(http.HandlerFunc(gradeHandler.Create)))
	r.mux.Handle("POST /api/v1/courses/{course_id}/grades/bulk", auth(http.HandlerFunc(gradeHandler.BulkCreate)))
	r.mux.Handle("GET /api/v1/grades", auth(http.HandlerFunc(gradeHandler.GetIPKData)))
	r.mux.Handle("GET /api/v1/grades/gpa", auth(http.HandlerFunc(gradeHandler.CalculateGPA)))
	r.mux.Handle("GET /api/v1/grades/course", auth(http.HandlerFunc(gradeHandler.GetGradesForCourse)))
	r.mux.Handle("PUT /api/v1/grades", auth(http.HandlerFunc(gradeHandler.UpdateGrade)))
	r.mux.Handle("PUT /api/v1/grades/{course_id}", auth(http.HandlerFunc(gradeHandler.Update)))

	r.mux.Handle("GET /api/v1/events", auth(http.HandlerFunc(eventHandler.GetAll)))
	r.mux.Handle("GET /api/v1/events/upcoming", auth(http.HandlerFunc(eventHandler.GetUpcoming)))
	r.mux.Handle("GET /api/v1/events/{id}", auth(http.HandlerFunc(eventHandler.GetByID)))
	r.mux.Handle("POST /api/v1/events", auth(admin(http.HandlerFunc(eventHandler.Create))))
	r.mux.Handle("PUT /api/v1/events/{id}", auth(admin(http.HandlerFunc(eventHandler.Update))))
	r.mux.Handle("DELETE /api/v1/events/{id}", auth(admin(http.HandlerFunc(eventHandler.Delete))))

	r.mux.Handle("GET /api/v1/dashboard/summary", auth(http.HandlerFunc(dashboardHandler.GetSummary)))

	r.mux.Handle("GET /api/v1/search/index", auth(http.HandlerFunc(searchHandler.GetIndex)))
	r.mux.Handle("GET /api/v1/search", auth(http.HandlerFunc(searchHandler.Search)))

	topicHandler := handler.NewTopicHandler(r.topicUsecase)
	questionHandler := handler.NewQuestionHandler(r.questionUsecase)
	// Topic routes (specific patterns first to avoid wildcard conflicts)
	r.mux.Handle("GET /api/v1/courses/{course_id}/topics-with-sessions", auth(http.HandlerFunc(topicHandler.GetTopicsWithSessions)))
	r.mux.Handle("POST /api/v1/courses/{course_id}/topics", auth(admin(http.HandlerFunc(topicHandler.CreateTopic))))
	r.mux.Handle("GET /api/v1/courses/{course_id}/topics", auth(http.HandlerFunc(topicHandler.GetTopicsByCourseID)))
	r.mux.Handle("GET /api/v1/topics/{id}", auth(http.HandlerFunc(topicHandler.GetTopicByID)))
	r.mux.Handle("GET /api/v1/topics/{id}/details", auth(http.HandlerFunc(topicHandler.GetTopicWithDetails)))
	r.mux.Handle("PUT /api/v1/topics/{id}", auth(admin(http.HandlerFunc(topicHandler.UpdateTopic))))
	r.mux.Handle("DELETE /api/v1/topics/{id}", auth(admin(http.HandlerFunc(topicHandler.DeleteTopic))))
	r.mux.Handle("POST /api/v1/topics/{id}/sessions", auth(admin(http.HandlerFunc(topicHandler.AssignSessionToTopic))))
	r.mux.Handle("DELETE /api/v1/topics/{id}/sessions/{session_id}", auth(admin(http.HandlerFunc(topicHandler.RemoveSessionFromTopic))))
	r.mux.Handle("PUT /api/v1/topics/reorder", auth(admin(http.HandlerFunc(topicHandler.ReorderTopics))))

	// Topic material routes
	r.mux.Handle("GET /api/v1/topics/{topic_id}/materials", auth(http.HandlerFunc(courseHandler.GetMaterialsByTopic)))
	r.mux.Handle("POST /api/v1/topics/{topic_id}/materials", auth(admin(http.HandlerFunc(courseHandler.CreateMaterialForTopic))))
	r.mux.Handle("DELETE /api/v1/topics/materials/{material_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteMaterial))))

	// Question routes
	r.mux.Handle("GET /api/v1/courses/{course_id}/questions", auth(http.HandlerFunc(questionHandler.GetByCourseID)))
	r.mux.Handle("POST /api/v1/questions", auth(admin(http.HandlerFunc(questionHandler.Create))))
	r.mux.Handle("GET /api/v1/questions/{id}", auth(http.HandlerFunc(questionHandler.GetByID)))
	r.mux.Handle("PUT /api/v1/questions/{id}", auth(admin(http.HandlerFunc(questionHandler.Update))))
	r.mux.Handle("DELETE /api/v1/questions/{id}", auth(admin(http.HandlerFunc(questionHandler.Delete))))
	r.mux.Handle("POST /api/v1/questions/{id}/submit", auth(http.HandlerFunc(questionHandler.SubmitExam)))
	r.mux.Handle("GET /api/v1/questions/{id}/submissions", auth(admin(http.HandlerFunc(questionHandler.GetSubmissions))))
	r.mux.Handle("GET /api/v1/users/me/submissions", auth(http.HandlerFunc(questionHandler.GetUserSubmissions)))

	r.mux.Handle("GET /api/v1/users", auth(admin(http.HandlerFunc(userHandler.GetAllUsers))))
	r.mux.Handle("GET /api/v1/users/{id}", auth(admin(http.HandlerFunc(userHandler.GetUserByID))))
	r.mux.Handle("PUT /api/v1/users/{id}/role", auth(admin(http.HandlerFunc(userHandler.UpdateUserRole))))
	r.mux.Handle("GET /api/v1/roles", auth(http.HandlerFunc(userHandler.GetAvailableRoles)))

	r.mux.Handle("GET /api/v1/export/courses", auth(admin(http.HandlerFunc(excelHandler.ExportCourses))))
	r.mux.Handle("GET /api/v1/export/template", auth(admin(http.HandlerFunc(excelHandler.ExportTemplate))))
	r.mux.Handle("GET /api/v1/export/grades", auth(http.HandlerFunc(excelHandler.ExportGrades)))
	r.mux.Handle("POST /api/v1/import/courses", auth(admin(http.HandlerFunc(excelHandler.ImportCourses))))
	r.mux.Handle("POST /api/v1/import/preview", auth(admin(http.HandlerFunc(excelHandler.PreviewImport))))

	// Grade Component routes
	r.mux.Handle("POST /api/v1/courses/{course_id}/grade-components", auth(admin(http.HandlerFunc(gradeComponentHandler.CreateGradeComponent))))
	r.mux.Handle("GET /api/v1/courses/{course_id}/grade-components", auth(http.HandlerFunc(gradeComponentHandler.GetGradeComponentsByCourseID)))
	r.mux.Handle("PUT /api/v1/grade-components/{id}", auth(admin(http.HandlerFunc(gradeComponentHandler.UpdateGradeComponent))))
	r.mux.Handle("DELETE /api/v1/grade-components/{id}", auth(admin(http.HandlerFunc(gradeComponentHandler.DeleteGradeComponent))))

	// Schedule routes
	scheduleHandler := handler.NewScheduleHandler(r.scheduleUsecase)
	r.mux.Handle("GET /api/v1/schedules", auth(http.HandlerFunc(scheduleHandler.GetAll)))
	r.mux.Handle("GET /api/v1/schedules/current", auth(http.HandlerFunc(scheduleHandler.GetCurrentSchedule)))
	r.mux.Handle("GET /api/v1/schedules/active", auth(http.HandlerFunc(scheduleHandler.GetActive)))
	r.mux.Handle("GET /api/v1/schedules/{id}", auth(http.HandlerFunc(scheduleHandler.GetByID)))
	r.mux.Handle("GET /api/v1/courses/{course_id}/schedules", auth(http.HandlerFunc(scheduleHandler.GetByCourseID)))
	r.mux.Handle("POST /api/v1/schedules", auth(admin(http.HandlerFunc(scheduleHandler.Create))))
	r.mux.Handle("PUT /api/v1/schedules/{id}", auth(admin(http.HandlerFunc(scheduleHandler.Update))))
	r.mux.Handle("DELETE /api/v1/schedules/{id}", auth(admin(http.HandlerFunc(scheduleHandler.Delete))))

	// Cawu routes
	cawuHandler := handler.NewCawuHandler(r.cawuUsecase)
	r.mux.Handle("POST /api/v1/cawu", auth(admin(http.HandlerFunc(cawuHandler.Create))))
	r.mux.Handle("GET /api/v1/cawu", auth(http.HandlerFunc(cawuHandler.GetAll)))
	r.mux.Handle("GET /api/v1/cawu/{id}", auth(http.HandlerFunc(cawuHandler.GetByID)))
	r.mux.Handle("PUT /api/v1/cawu/{id}", auth(admin(http.HandlerFunc(cawuHandler.Update))))
	r.mux.Handle("DELETE /api/v1/cawu/{id}", auth(admin(http.HandlerFunc(cawuHandler.Delete))))
	r.mux.Handle("PUT /api/v1/cawu/{id}/active", auth(admin(http.HandlerFunc(cawuHandler.SetActive))))
	r.mux.Handle("GET /api/v1/cawu/active/current", auth(http.HandlerFunc(cawuHandler.GetActive)))
	r.mux.Handle("GET /api/v1/cawu/{cawuID}/courses", auth(http.HandlerFunc(cawuHandler.FilterCourses)))

	// Calendar routes
	calendarHandler := handler.NewCalendarHandler(r.calendarUsecase)
	r.mux.Handle("GET /api/v1/calendar", auth(http.HandlerFunc(calendarHandler.GetAllEvents)))
	r.mux.Handle("GET /api/v1/calendar/active", auth(http.HandlerFunc(calendarHandler.GetActiveSessions)))
	r.mux.Handle("GET /api/v1/calendar/upcoming", auth(http.HandlerFunc(calendarHandler.GetUpcomingEvents)))
	r.mux.Handle("GET /api/v1/calendar/{id}", auth(http.HandlerFunc(calendarHandler.GetEvent)))
	r.mux.Handle("POST /api/v1/calendar", auth(http.HandlerFunc(calendarHandler.CreateEvent)))
	r.mux.Handle("PUT /api/v1/calendar/{id}", auth(http.HandlerFunc(calendarHandler.UpdateEvent)))
	r.mux.Handle("DELETE /api/v1/calendar/{id}", auth(http.HandlerFunc(calendarHandler.DeleteEvent)))
	r.mux.Handle("PATCH /api/v1/calendar/{id}/active", auth(admin(http.HandlerFunc(calendarHandler.SetActiveSession))))

	// Board Gallery routes
	boardGalleryHandler := handler.NewBoardGalleryHandler(r.boardGalleryUsecase)
	r.mux.Handle("POST /api/v1/board-gallery", auth(http.HandlerFunc(boardGalleryHandler.Create)))
	r.mux.Handle("GET /api/v1/board-gallery/session/{session_id}", auth(http.HandlerFunc(boardGalleryHandler.GetBySessionID)))
	r.mux.Handle("GET /api/v1/board-gallery/{id}", auth(http.HandlerFunc(boardGalleryHandler.GetByID)))
	r.mux.Handle("PUT /api/v1/board-gallery/{id}", auth(http.HandlerFunc(boardGalleryHandler.Update)))
	r.mux.Handle("DELETE /api/v1/board-gallery/{id}", auth(http.HandlerFunc(boardGalleryHandler.Delete)))
	r.mux.Handle("PATCH /api/v1/board-gallery/{id}/reorder", auth(http.HandlerFunc(boardGalleryHandler.ReorderItems)))
	r.mux.Handle("GET /api/v1/topics/{topic_id}/photos", auth(http.HandlerFunc(boardGalleryHandler.GetPhotosByTopic)))

	// Bank Soal routes
	bankSoalHandler := handler.NewBankSoalHandler(r.bankSoalUsecase)
	// Exam Archives
	r.mux.Handle("POST /api/v1/bank-soal/archives", auth(admin(http.HandlerFunc(bankSoalHandler.CreateExamArchive))))
	r.mux.Handle("GET /api/v1/bank-soal/archives", auth(http.HandlerFunc(bankSoalHandler.GetExamArchives)))
	r.mux.Handle("GET /api/v1/bank-soal/archives/{id}", auth(http.HandlerFunc(bankSoalHandler.GetExamArchiveByID)))
	r.mux.Handle("PUT /api/v1/bank-soal/archives/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.UpdateExamArchive))))
	r.mux.Handle("DELETE /api/v1/bank-soal/archives/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.DeleteExamArchive))))
	// Simulations
	r.mux.Handle("POST /api/v1/bank-soal/simulations", auth(admin(http.HandlerFunc(bankSoalHandler.CreateSimulation))))
	r.mux.Handle("GET /api/v1/bank-soal/simulations", auth(http.HandlerFunc(bankSoalHandler.GetSimulations)))
	r.mux.Handle("GET /api/v1/bank-soal/simulations/{id}", auth(http.HandlerFunc(bankSoalHandler.GetSimulationByID)))
	r.mux.Handle("PUT /api/v1/bank-soal/simulations/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.UpdateSimulation))))
	r.mux.Handle("DELETE /api/v1/bank-soal/simulations/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.DeleteSimulation))))
	// Questions
	r.mux.Handle("POST /api/v1/bank-soal/simulations/{simulation_id}/questions", auth(admin(http.HandlerFunc(bankSoalHandler.CreateQuestion))))
	r.mux.Handle("GET /api/v1/bank-soal/simulations/{simulation_id}/questions", auth(http.HandlerFunc(bankSoalHandler.GetQuestionsBySimulation)))
	r.mux.Handle("PUT /api/v1/bank-soal/questions/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.UpdateQuestion))))
	r.mux.Handle("DELETE /api/v1/bank-soal/questions/{id}", auth(admin(http.HandlerFunc(bankSoalHandler.DeleteQuestion))))

	// Notification routes
	notificationHandler := handler.NewNotificationHandler(r.fonnteService)
	r.mux.Handle("POST /api/v1/notifications/send", auth(admin(http.HandlerFunc(notificationHandler.SendNotification))))
	r.mux.Handle("POST /api/v1/notifications/task", auth(http.HandlerFunc(notificationHandler.SendTaskNotification)))

	// Google Calendar routes (only if configured)
	if r.gcalUsecase != nil {
		gcalHandler := handler.NewGoogleCalendarHandler(r.gcalUsecase)
		r.mux.Handle("POST /api/v1/calendar/sync", auth(admin(http.HandlerFunc(gcalHandler.Sync))))
		r.mux.Handle("POST /api/v1/calendar/sync/webhook", auth(http.HandlerFunc(gcalHandler.WebhookSync)))
		r.mux.Handle("GET /api/v1/calendar/events", auth(http.HandlerFunc(gcalHandler.GetEvents)))
		r.mux.Handle("GET /api/v1/calendar/test", http.HandlerFunc(gcalHandler.TestConnection))
	}
}

func newGoogleCalendarUsecase(cfg *config.Config, schedRepo domain.ScheduleRepository, courseRepo domain.CourseRepository) *usecase.GoogleCalendarUsecase {
	if !cfg.HasGoogleCalendar() {
		return nil
	}
	jsonKey := []byte(cfg.GoogleCalJSONKey)
	gcal, err := usecase.NewGoogleCalendarUsecase(jsonKey, cfg.GoogleCalID, schedRepo, courseRepo)
	if err != nil {
		log.Printf("[gcal] failed to initialize: %v", err)
		return nil
	}
	log.Printf("[gcal] initialized with calendar ID: %s", cfg.GoogleCalID)
	return gcal
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	handler := r.corsMiddleware.Handle(r.mux)
	handler = r.rateLimiter.Handle(handler)
	handler = r.compressionMiddleware.Handle(handler)
	handler.ServeHTTP(w, req)
}
