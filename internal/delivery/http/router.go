package http

import (
	"database/sql"
	"mrt-backend/internal/delivery/http/handler"
	"mrt-backend/internal/delivery/http/middleware"
	"mrt-backend/internal/repository/postgres"
	"mrt-backend/internal/usecase"
	"net/http"
	"time"
)

type Router struct {
	mux              *http.ServeMux
	db               *sql.DB
	authUsecase      *usecase.AuthUsecase
	courseUsecase    *usecase.CourseUsecase
	gradeUsecase     *usecase.GradeUsecase
	eventUsecase     *usecase.EventUsecase
	dashboardUsecase *usecase.DashboardUsecase
	searchUsecase    *usecase.SearchUsecase
	authMiddleware   *middleware.AuthMiddleware
	corsMiddleware   *middleware.CORSMiddleware
}

func NewRouter(db *sql.DB, jwtSecret string) *Router {
	userRepo := postgres.NewUserRepo(db)
	userRoleRepo := postgres.NewUserRoleRepo(db)
	courseRepo := postgres.NewCourseRepo(db)
	sessionRepo := postgres.NewSessionRepo(db)
	materialRepo := postgres.NewMaterialRepo(db)
	taskRepo := postgres.NewTaskRepo(db)
	gradeRepo := postgres.NewGradeRepo(db)
	eventRepo := postgres.NewEventRepo(db)
	dashboardRepo := postgres.NewDashboardRepo(db)
	searchRepo := postgres.NewSearchRepo(db)

	authUsecase := usecase.NewAuthUsecase(userRepo, userRoleRepo, jwtSecret)
	courseUsecase := usecase.NewCourseUsecase(courseRepo, sessionRepo, materialRepo, taskRepo)
	gradeUsecase := usecase.NewGradeUsecase(gradeRepo)
	eventUsecase := usecase.NewEventUsecase(eventRepo)
	dashboardUsecase := usecase.NewDashboardUsecase(dashboardRepo)
	searchUsecase := usecase.NewSearchUsecase(searchRepo, 5*time.Minute)

	return &Router{
		mux:              http.NewServeMux(),
		db:               db,
		authUsecase:      authUsecase,
		courseUsecase:    courseUsecase,
		gradeUsecase:     gradeUsecase,
		eventUsecase:     eventUsecase,
		dashboardUsecase: dashboardUsecase,
		searchUsecase:    searchUsecase,
		authMiddleware:   middleware.NewAuthMiddleware(authUsecase),
		corsMiddleware:   middleware.NewCORSMiddleware(),
	}
}

func (r *Router) Setup() {
	healthHandler := handler.NewHealthHandler(r.db)
	docsHandler := handler.NewDocsHandler()
	authHandler := handler.NewAuthHandler(r.authUsecase)
	courseHandler := handler.NewCourseHandler(r.courseUsecase)
	gradeHandler := handler.NewGradeHandler(r.gradeUsecase)
	eventHandler := handler.NewEventHandler(r.eventUsecase)
	dashboardHandler := handler.NewDashboardHandler(r.dashboardUsecase)
	searchHandler := handler.NewSearchHandler(r.searchUsecase)

	auth := r.authMiddleware.Authenticate
	admin := r.authMiddleware.RequireAdmin()

	r.mux.HandleFunc("GET /api/health", healthHandler.Check)
	r.mux.HandleFunc("GET /api/docs", docsHandler.ServeSpec)

	r.mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	r.mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	r.mux.Handle("GET /api/users/me", auth(http.HandlerFunc(authHandler.GetCurrentUser)))

	r.mux.Handle("GET /api/courses", auth(http.HandlerFunc(courseHandler.List)))
	r.mux.Handle("POST /api/courses", auth(admin(http.HandlerFunc(courseHandler.Create))))
	r.mux.Handle("GET /api/courses/{id}", auth(http.HandlerFunc(courseHandler.GetByID)))
	r.mux.Handle("PUT /api/courses/{id}", auth(admin(http.HandlerFunc(courseHandler.Update))))
	r.mux.Handle("DELETE /api/courses/{id}", auth(admin(http.HandlerFunc(courseHandler.Delete))))

	r.mux.Handle("GET /api/courses/{course_id}/sessions", auth(http.HandlerFunc(courseHandler.ListSessions)))
	r.mux.Handle("POST /api/courses/{course_id}/sessions", auth(admin(http.HandlerFunc(courseHandler.CreateSession))))
	r.mux.Handle("PUT /api/sessions/{session_id}", auth(admin(http.HandlerFunc(courseHandler.UpdateSession))))
	r.mux.Handle("DELETE /api/sessions/{session_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteSession))))

	r.mux.Handle("GET /api/courses/{course_id}/materials", auth(http.HandlerFunc(courseHandler.GetMaterialsByCourse)))
	r.mux.Handle("POST /api/materials", auth(admin(http.HandlerFunc(courseHandler.CreateMaterial))))
	r.mux.Handle("PUT /api/materials/{material_id}", auth(admin(http.HandlerFunc(courseHandler.UpdateMaterial))))
	r.mux.Handle("DELETE /api/materials/{material_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteMaterial))))

	r.mux.Handle("GET /api/courses/{course_id}/tasks", auth(http.HandlerFunc(courseHandler.ListTasks)))
	r.mux.Handle("POST /api/courses/{course_id}/tasks", auth(admin(http.HandlerFunc(courseHandler.CreateTask))))
	r.mux.Handle("PUT /api/tasks/{task_id}", auth(admin(http.HandlerFunc(courseHandler.UpdateTask))))
	r.mux.Handle("DELETE /api/tasks/{task_id}", auth(admin(http.HandlerFunc(courseHandler.DeleteTask))))
	r.mux.Handle("PATCH /api/tasks/{task_id}/progress", auth(http.HandlerFunc(courseHandler.UpdateTaskProgress)))

	r.mux.Handle("POST /api/grades", auth(http.HandlerFunc(gradeHandler.Create)))
	r.mux.Handle("GET /api/grades", auth(http.HandlerFunc(gradeHandler.GetUserGrades)))
	r.mux.Handle("GET /api/grades/gpa", auth(http.HandlerFunc(gradeHandler.CalculateGPA)))
	r.mux.Handle("PUT /api/grades/{course_id}", auth(http.HandlerFunc(gradeHandler.Update)))

	r.mux.Handle("GET /api/events", auth(http.HandlerFunc(eventHandler.GetAll)))
	r.mux.Handle("GET /api/events/upcoming", auth(http.HandlerFunc(eventHandler.GetUpcoming)))
	r.mux.Handle("GET /api/events/{id}", auth(http.HandlerFunc(eventHandler.GetByID)))
	r.mux.Handle("POST /api/events", auth(admin(http.HandlerFunc(eventHandler.Create))))
	r.mux.Handle("PUT /api/events/{id}", auth(admin(http.HandlerFunc(eventHandler.Update))))
	r.mux.Handle("DELETE /api/events/{id}", auth(admin(http.HandlerFunc(eventHandler.Delete))))

	r.mux.Handle("GET /api/dashboard/summary", auth(http.HandlerFunc(dashboardHandler.GetSummary)))

	r.mux.Handle("GET /api/search/index", auth(http.HandlerFunc(searchHandler.GetIndex)))
	r.mux.Handle("GET /api/search", auth(http.HandlerFunc(searchHandler.Search)))
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.corsMiddleware.Handle(r.mux).ServeHTTP(w, req)
}
