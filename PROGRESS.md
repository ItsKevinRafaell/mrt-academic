# MRT Backend - Progress & Plan

**Last Updated:** 14 Juni 2026
**Current Session:** Implementing API gap fixes from frontend team

---

## 📍 Current Status

### Completed Tasks
- ✅ **Task #6:** Restructure project to monorepo (backend/ + frontend/)
- ✅ **Task #7:** Refactor usecases for testability + fix tests
- ✅ **Task #8:** Create curl test scripts for all endpoints
- ✅ **Task #10:** Schema revisions (cawu_id, submission_link, material types)
- ✅ **Task #11:** Questions/Bank Soal (CRUD + submit + exam session)
- ✅ **Task #12:** Task monitoring endpoints (admin)

### In Progress
- 🔄 **Task #13:** User management endpoints
  - Created `user_usecase.go` and `user_handler.go`
  - Need to fix `GetAll()` method in UserRepository
  - Need to register routes in router.go
  - Need to build and test

### Not Started
- ⬜ **Task #9:** Production Dockerfile + docker-compose for production

---

## 📋 API Gap Analysis (from Frontend Team)

**Source:** Frontend team identified missing endpoints and schema issues

### Priority Matrix

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Dashboard summary | ✅ Already exists | Response structure flexible - frontend will format |
| 2 | Events CRUD | ✅ Already exists | No changes needed |
| 3 | Grades/IPK | ✅ Already exists | Path is `/api/grades` (more RESTful than `/api/ipk`) |
| 4 | Questions (Bank Soal) | ✅ **COMPLETED** | Just implemented CRUD + submit + exam session |
| 5 | Task monitoring | ✅ **COMPLETED** | Just implemented admin progress endpoints |
| 6 | Search | ✅ Already exists | Client-side search also available |
| 7 | User/Role management | 🔄 **IN PROGRESS** | Working on it now |
| 8 | Schema fixes | ✅ **COMPLETED** | cawu_id, submission_link, material types added |

---

## 🔧 What Was Just Done

### Task #10: Schema Revisions
**Files Modified:**
- `migrations/005_add_schema_revisions.sql` - Added cawu_id to courses, submission_link to tasks, expanded material types
- `internal/domain/course.go` - Added CawuID field
- `internal/domain/task.go` - Added SubmissionLink field
- `internal/domain/material.go` - Expanded Type enum (pdf, link, video, image, ppt, doc, youtube)
- `internal/repository/postgres/course_repo.go` - Updated all queries to include cawu_id
- `internal/repository/postgres/task_repo.go` - Updated all queries to include submission_link

**Status:** ✅ Complete and building successfully

### Task #11: Questions/Bank Soal
**Files Created:**
- `internal/domain/question.go` - Question, QuestionOption, ExamSubmission entities
- `internal/repository/postgres/question_repo.go` - CRUD operations
- `internal/repository/postgres/exam_submission_repo.go` - Exam submission storage
- `internal/usecase/question_usecase.go` - Business logic
- `internal/delivery/http/handler/question_handler.go` - HTTP handlers

**Endpoints Added:**
```
GET    /api/courses/{course_id}/questions
POST   /api/questions                    (admin only)
GET    /api/questions/{id}
PUT    /api/questions/{id}               (admin only)
DELETE /api/questions/{id}               (admin only)
POST   /api/questions/{id}/submit
GET    /api/questions/{id}/submissions   (admin only)
GET    /api/users/me/submissions
```

**Status:** ✅ Complete and building successfully

### Task #12: Task Monitoring
**Files Modified:**
- `internal/domain/task.go` - Added TaskProgressWithUser, TaskMonitoringSummary types
- `internal/repository/postgres/task_repo.go` - Added GetProgressWithUsersByTaskID, GetTotalUserCount
- `internal/usecase/task_usecase.go` - Added GetTaskProgressSummary, GetCourseProgressSummary
- `internal/delivery/http/handler/task_handler.go` - Added monitoring handlers
- `internal/delivery/http/router.go` - Registered monitoring endpoints

**Endpoints Added:**
```
GET /api/tasks/{id}/monitoring                    (admin only)
GET /api/courses/{course_id}/tasks/monitoring     (admin only)
```

**Status:** ✅ Complete and building successfully

### Task #13: User Management (CURRENT)
**Files Created:**
- `internal/usecase/user_usecase.go` - UserUseCase with GetAllUsers, GetUserByID, UpdateUserRole
- `internal/delivery/http/handler/user_handler.go` - HTTP handlers

**What Needs to be Done:**
1. ❌ Fix `GetAll()` method in UserRepository (doesn't exist yet)
2. ❌ Add `GetAll()` to UserRepo interface in `internal/domain/user.go`
3. ❌ Implement `GetAll()` in `internal/repository/postgres/user_repo.go`
4. ❌ Register user routes in `internal/delivery/http/router.go`
5. ❌ Build and test

**Expected Endpoints:**
```
GET  /api/users              (admin only) - List all users
GET  /api/users/{id}         (admin only) - Get user detail
PUT  /api/users/{id}/role    (super_admin only) - Update user role
GET  /api/roles              (admin only) - List available roles
```

---

## 🏗️ Architecture Notes

### Clean Architecture Layers
```
Handler (HTTP) → UseCase (Business Logic) → Repository (Database)
```

### Key Patterns
- **Dependency Injection:** UseCases receive Repository interfaces
- **Error Handling:** Custom errors in `domain/errors.go`
- **Response Format:** Standardized JSON responses
- **Authentication:** JWT tokens with role-based access control

### Database
- PostgreSQL with pgx driver
- Migrations in `migrations/` folder (numbered)
- Run migrations: `./migrate.sh`

### Testing
- Unit tests exist for all usecases (22 passing)
- Mock repositories for testing
- Run tests: `cd backend && go test ./...`

---

## 🚀 Next Steps (for next Claude session)

### Immediate (Complete Task #13)
1. Read `internal/domain/user.go` to see current UserRepository interface
2. Add `GetAll() ([]User, error)` method to interface
3. Implement `GetAll()` in `internal/repository/postgres/user_repo.go`
4. Register routes in `internal/delivery/http/router.go`:
   ```go
   r.mux.HandleFunc("GET /api/users", withAuth(userHandler.GetAllUsers, true))
   r.mux.HandleFunc("GET /api/users/{id}", withAuth(userHandler.GetUserByID, true))
   r.mux.HandleFunc("PUT /api/users/{id}/role", withAuth(userHandler.UpdateUserRole, true, "super_admin"))
   r.mux.HandleFunc("GET /api/roles", withAuth(userHandler.GetAvailableRoles, true))
   ```
5. Build: `cd backend && go build -o bin/api cmd/api/main.go`
6. Test endpoints with curl

### After Task #13
- Complete Task #9: Production Dockerfile
- Update OpenAPI spec (`docs/openapi.yaml`) with all new endpoints
- Test all endpoints end-to-end
- Prepare for frontend integration

### Notes for Frontend Integration
- Dashboard: Response structure is flexible, frontend will format
- Grades: Path is `/api/grades` (not `/api/ipk`)
- Docker: Using Caddy (not NGINX), single docker-compose.yml
- Exam timer: Client-side implementation (backend just returns config)

---

## 📂 Key Files

### Domain Layer
- `internal/domain/` - All entities and interfaces

### Repository Layer
- `internal/repository/postgres/` - Database implementations
- `migrations/` - SQL migrations

### UseCase Layer
- `internal/usecase/` - Business logic
- `internal/usecase/auth_usecase.go` - Authentication
- `internal/usecase/course_usecase.go` - Course management
- `internal/usecase/question_usecase.go` - Questions (new)
- `internal/usecase/task_usecase.go` - Tasks + monitoring
- `internal/usecase/user_usecase.go` - User management (new)

### Handler Layer
- `internal/delivery/http/handler/` - HTTP handlers
- `internal/delivery/http/router.go` - Route registration
- `internal/delivery/http/middleware/` - Auth, CORS, etc.

### Configuration
- `CLAUDE.md` - Project guidelines and conventions
- `backend/.env.example` - Environment variables template
- `docker-compose.yml` - Local development setup

---

## 🔑 Important Commands

```bash
# Build
cd backend && go build -o bin/api cmd/api/main.go

# Run tests
cd backend && go test ./...

# Start server (local)
cd backend && ./bin/api

# Run migrations
./migrate.sh

# Docker (local dev)
docker-compose up -d
```

---

## 📝 Session Prompt (Copy this for next Claude session)

```
Continue MRT Backend development.

Current Status:
- Task #13 (User Management) is IN PROGRESS
- Files created: user_usecase.go, user_handler.go
- Next steps:
  1. Add GetAll() method to UserRepository interface in internal/domain/user.go
  2. Implement GetAll() in internal/repository/postgres/user_repo.go
  3. Register user routes in internal/delivery/http/router.go
  4. Build and test

After Task #13:
- Complete Task #9 (Production Dockerfile)
- Update OpenAPI spec with all new endpoints
- Prepare for frontend integration

See PROGRESS.md for full context and API gap analysis.
```
