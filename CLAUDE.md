# MRT Academic Management App — Backend

All-in-one class management platform for MRT ecosystem. This document is the single source of truth for backend development. Every architectural decision, convention, and constraint is recorded here.

**Last updated:** 2026-06-21

---

## Quick Reference

### Run the backend
```bash
cd /home/kevin/MRT/backend
export PATH=$PATH:/usr/local/go/bin
./bin/mrt-server
# Server runs on http://localhost:9090
```

### Run tests
```bash
cd /home/kevin/MRT/backend
export PATH=$PATH:/usr/local/go/bin
go test ./internal/usecase -v
```

### Test all endpoints
```bash
cd /home/kevin/MRT
./scripts/test/test-api.sh http://localhost:9090
```

### Interactive API docs
```
http://localhost:9090/api/swagger
```

### Run migrations
```bash
cd /home/kevin/MRT
./scripts/db-migrate.sh
```

### Docker (full stack)
```bash
cd /home/kevin/MRT
docker compose up -d
```

---

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Infrastructure: Docker, DB schema, health check, OpenAPI docs, config loader, DB pool |
| Phase 2 | ✅ Complete | Auth: Register, login, JWT (24h), auth middleware, RBAC, promote-admin script |
| Phase 3 | ✅ Complete | Core CRUD: Courses, sessions, materials, tasks (admin), task progress (all users), CORS |
| Phase 4 | ✅ Complete | Advanced: Grades/GPA, grade components, academic events, dashboard, global search with cache |
| Phase 5 | ✅ Complete | Extended: Topics, schedules, board gallery, bank soal (arsip+CBT sim), calendar events, Excel import/export, user management |
| Phase 6 | ✅ Complete | Frontend: Next.js 14 App Router, 23 pages, 150+ components, Zustand stores, shadcn/ui |
| Phase 7 | ✅ Complete | Unit tests (29 passing), Swagger UI, middleware tests, test scripts, monorepo structure |
| Phase 8 | ⬜ Next | CI/CD pipeline, E2E testing, production deployment, Caddyfile |

---

## Tech Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Language | Go | 1.23+ |
| Router | net/http (enhanced routing) | Go 1.22+ |
| Database | PostgreSQL | 16+ |
| DB Driver | lib/pq | Latest |
| Auth | golang-jwt/jwt/v5 | v5 |
| Password | golang.org/x/crypto/bcrypt | Latest |
| Test Mock | DATA-DOG/go-sqlmock | Latest |
| Reverse Proxy | Caddy | 2.x |
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui | 14.x |

**Total backend dependencies: 4** (jwt, bcrypt, pq, sqlmock)

---

## Architecture

### Clean Architecture — 3 Layers

```
Handler (delivery/http)  →  HTTP request/response, validation
    ↓ calls
Usecase (business logic) →  Business rules, orchestration
    ↓ calls
Repository (data access) →  Raw SQL, database operations
```

**Dependency rule:** Each layer only depends on the layer below it via **interfaces defined in the consumer layer**, not the producer.

- `domain/` defines structs and repository interfaces
- `usecase/` depends on `domain/` only
- `repository/` implements `domain/` interfaces
- `handler/` depends on usecase interfaces

### Error Flow — 3 Layer Propagation

```
Repository  → returns (data, error) — raw sql errors or domain errors
Usecase     → wraps with context: ErrNotFound, ErrForbidden, ErrValidation, ErrUnauthorized
Handler     → maps domain error → HTTP status + error_code JSON
```

**Domain error types:**

| Domain Error | HTTP Status | Error Code |
|-------------|-------------|------------|
| ErrNotFound | 404 | ERR_NOT_FOUND |
| ErrValidation | 400 | ERR_VALIDATION |
| ErrUnauthorized | 401 | ERR_UNAUTHORIZED |
| ErrForbidden | 403 | ERR_FORBIDDEN |
| ErrInternal | 500 | ERR_INTERNAL_SERVER |

**Rules:**
- Never swallow errors (`_ = err` is forbidden)
- Always propagate or return
- 500 errors: log full detail server-side, hide from client

---

## Project Structure

```
backend/
├── cmd/api/main.go                  # Entrypoint, dependency wiring only
├── cmd/promote-admin/main.go        # Promote user to super_admin
├── cmd/seed/main.go                 # Seed test data
├── internal/
│   ├── config/
│   │   └── config.go                # Environment configuration
│   ├── domain/                      # Structs + interfaces (zero imports)
│   │   ├── board_gallery.go
│   │   ├── calendar_event.go
│   │   ├── calendar_repository.go
│   │   ├── cawu.go
│   │   ├── course.go
│   │   ├── dashboard_repository.go
│   │   ├── errors.go
│   │   ├── event.go
│   │   ├── event_repository.go
│   │   ├── exam_archive.go
│   │   ├── grade.go
│   │   ├── grade_component.go
│   │   ├── material.go
│   │   ├── question.go
│   │   ├── schedule.go
│   │   ├── session.go
│   │   ├── task.go
│   │   ├── topic.go
│   │   ├── user.go
│   │   └── user_role.go
│   ├── usecase/                     # Business logic
│   │   ├── auth_usecase.go
│   │   ├── bank_soal_usecase.go
│   │   ├── board_gallery_usecase.go
│   │   ├── calendar_usecase.go
│   │   ├── cawu_usecase.go
│   │   ├── course_usecase.go
│   │   ├── dashboard_usecase.go
│   │   ├── event_usecase.go
│   │   ├── excel_usecase.go
│   │   ├── grade_component_usecase.go
│   │   ├── grade_usecase.go
│   │   ├── question_usecase.go
│   │   ├── schedule_usecase.go
│   │   ├── search_usecase.go
│   │   ├── task_usecase.go
│   │   ├── topic_usecase.go
│   │   └── user_usecase.go
│   ├── delivery/http/               # HTTP layer
│   │   ├── handler/
│   │   │   ├── auth_handler.go
│   │   │   ├── bank_soal_handler.go
│   │   │   ├── board_gallery_handler.go
│   │   │   ├── calendar_handler.go
│   │   │   ├── cawu_handler.go
│   │   │   ├── course_handler.go
│   │   │   ├── dashboard_handler.go
│   │   │   ├── docs.go
│   │   │   ├── error_helper.go
│   │   │   ├── event_handler.go
│   │   │   ├── excel_handler.go
│   │   │   ├── grade_component_handler.go
│   │   │   ├── grade_handler.go
│   │   │   ├── question_handler.go
│   │   │   ├── schedule_handler.go
│   │   │   ├── search_handler.go
│   │   │   ├── swagger_handler.go
│   │   │   ├── task_handler.go
│   │   │   ├── topic_handler.go
│   │   │   ├── user_handler.go
│   │   │   └── health_handler.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   └── cors.go
│   │   ├── router.go
│   │   └── response.go
│   ├── repository/postgres/         # Raw SQL implementations
│   │   ├── board_gallery_repository.go
│   │   ├── calendar_repo.go
│   │   ├── cawu_repo.go
│   │   ├── course_repo.go
│   │   ├── dashboard_repo.go
│   │   ├── db.go
│   │   ├── event_repo.go
│   │   ├── exam_archive_repository.go
│   │   ├── exam_submission_repository.go
│   │   ├── grade_component_repo.go
│   │   ├── grade_repo.go
│   │   ├── material_repo.go
│   │   ├── question_repo.go
│   │   ├── schedule_repo.go
│   │   ├── search_repo.go
│   │   ├── session_repo.go
│   │   ├── system_settings_repo.go
│   │   ├── task_repo.go
│   │   ├── topic_repository.go
│   │   └── user_repo.go
├── migrations/                      # Numbered raw SQL files (001–026)
│   ├── 001_initial_schema.sql
│   ├── 002_add_grade_fields_and_cawu.sql
│   ├── ...
│   ├── 024_create_board_gallery.sql
│   ├── 025_create_bank_soal.sql
│   └── 026_seed_bank_soal.sql
├── go.mod
├── .env.example
└── .gitignore
```

**Every `.go` file MUST have a corresponding `_test.go` file.**

---

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Go file | snake_case | `course_handler.go` |
| Struct | PascalCase | `CourseUseCase` |
| Function (exported) | PascalCase | `GetCourseByID` |
| Function (private) | camelCase | `buildSearchIndex` |
| Constant | PascalCase | `ErrNotFound` |
| DB table | snake_case + plural | `user_roles` |
| DB column | snake_case | `created_at` |
| API route | kebab-case | `/api/v1/kalkulator-ipk` |
| Env variable | SCREAMING_SNAKE | `DATABASE_URL` |
| Test file | `*_test.go` | `course_handler_test.go` |

---

## Clean Code Rules

| Rule | Limit |
|------|-------|
| Comments | **ZERO** — code must be self-documenting |
| Lines per file | Max 100 |
| Lines per function | Max 30 |
| Nesting | Early return / guard clause — no nested if-else |
| Magic values | Forbidden — use constants |
| Domain struct | 1 struct per file |
| Interface location | Defined at consumer, not producer |

**If code needs a comment to explain "what" — the naming is wrong. Rename it.**
**If code needs a comment to explain "why" — the logic is too clever. Simplify it.**

---

## Authentication & Authorization

### JWT Stateless

| Aspect | Value |
|--------|-------|
| Mechanism | JWT Bearer Token |
| Expiry | 24 hours |
| Library | golang-jwt/jwt/v5 |
| Secret | From env `JWT_SECRET` |

### JWT Claims

```json
{
  "user_id": "uuid",
  "email": "user@student.ac.id",
  "role": "KURIKULUM",
  "cawu_id": 2,
  "exp": 1718496000
}
```

Role and cawu_id are embedded at login time based on the active cawu. No DB lookup per request.

### Password

- Algorithm: **bcrypt**
- Cost factor: 12 (default)

### RBAC Roles

| Role | Code |
|------|------|
| Super Admin | SUPER_ADMIN |
| Kurikulum | KURIKULUM |
| Sekretaris | SEKRETARIS |
| Komti | KOMTI |
| Wakomti | WAKOMTI |
| Warga Lokal | MAHASISWA |
| Others (Kesiswaan, Media, etc.) | MAHASISWA |

Role enforcement is done via middleware. Endpoints declare required roles.

---

## API Contract

### Base Response — Success (HTTP 200/201)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": null
}
```

### Base Response — Error

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error_code": "ERR_VALIDATION",
  "data": null
}
```

### Pagination (meta field)

```json
{
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### Headers

All authenticated requests MUST include:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Database Conventions

- All tables use `snake_case` and `plural` names
- Every table has `created_at TIMESTAMP DEFAULT NOW()`
- Every mutable table has `updated_at TIMESTAMP`
- Primary keys: `SERIAL` for int, `UUID` for users
- Foreign keys are always indexed
- All migrations are **idempotent** (`CREATE TABLE IF NOT EXISTS`)
- Parameterized queries only (`$1, $2`) — string concatenation is forbidden
- No ORM — raw SQL with `database/sql`

### Connection Pool Tuning

```
MaxOpenConns:    25
MaxIdleConns:    10
ConnMaxLifetime: 5 minutes
```

### Postgres Docker Tuning (VPS 1GB)

```
shared_buffers: 128MB
```

---

## Cache Strategy

### No Redis — In-Memory Go Cache

| Cache Target | Strategy | TTL |
|-------------|----------|-----|
| Search Index | Pre-computed at startup | 5 minutes |
| Dashboard Summary | Built on first request | 1 minute |

### Search Index Cache Flow

```
1. Go backend starts → query all courses, sessions, tasks from DB
2. Build search index in memory (map/struct)
3. GET /api/v1/search/index → return instantly (zero DB hit)
4. TTL expires → rebuild in background (non-blocking)
5. POST/PUT/DELETE on related data → manual invalidation
```

### ETag + Conditional Requests

- Search index endpoint returns `ETag` header (hash of data)
- Client sends `If-None-Match` → server returns `304 Not Modified` if unchanged
- Saves bandwidth and latency for repeat requests

---

## Performance Strategy (No Redis Required)

| Technique | Layer | Impact |
|-----------|-------|--------|
| Startup cache | Backend | Zero-latency search index |
| ETag / 304 | HTTP | Bandwidth savings |
| Connection pooling | DB | 10-50ms saved per query |
| Batch queries | SQL | 1 roundtrip instead of N+1 |
| Caddy auto-compress | Infra | 5x smaller JSON responses |
| Static files via Caddy | Infra | Bypass Go for file serving |
| Lazy loading | Frontend | Light initial page load |

---

## Configuration

### Environment Variables (.env)

```env
# Server
PORT=8000
ENV=development

# Database
DATABASE_URL=postgres://mrt:secret@localhost:5432/mrt_db?sslmode=disable

# Auth
JWT_SECRET=your-secret-key-min-32-chars

# Cache
SEARCH_CACHE_TTL=5m
DASHBOARD_CACHE_TTL=1m
```

- `.env.example` is committed to git
- `.env` is in `.gitignore`
- Config is read once at startup into a `Config` struct

---

## Security Rules

| Rule | Implementation |
|------|---------------|
| Password hashing | bcrypt, cost 12 |
| SQL injection | Parameterized queries only (`$1, $2`) |
| Auth | JWT Bearer token in header |
| CORS | Custom middleware, whitelist origins |
| Rate limiting | Custom in-memory, per-IP token bucket |
| File uploads | Validate MIME type + size limit |
| Secrets | Never hardcoded, always from env |
| Error exposure | 500 errors hide internals from client |

---

## Testing

### Strategy: Full Test From Day One

| Layer | Approach | Tool |
|-------|----------|------|
| Repository | sqlmock — verify SQL correctness | DATA-DOG/go-sqlmock |
| Usecase | Table-driven, mock interfaces | Hand-written mocks |
| Handler | httptest.NewRecorder, mock usecase | net/http/httptest |
| Middleware | httptest — auth reject, CORS | net/http/httptest |

### Rules

- Every `.go` file has a corresponding `_test.go`
- No real database dependency in tests — everything mocked
- Table-driven tests for multiple cases
- Target coverage per file: **> 80%**
- Test naming: `TestFunctionName_Scenario`

---

## Development Environment

| Aspect | Setup |
|--------|-------|
| Go runtime | Native (`go run cmd/api/main.go`) |
| PostgreSQL | Docker container only |
| Migration | Raw SQL numbered files, executed via script |
| Hot reload | None for MVP — `go run` rebuilds in ~2 seconds |
| Project root | `/home/kevin/MRT` |

### Dev Workflow (per endpoint)

```
1. Write migration SQL → test in Docker Postgres
2. Write domain (struct + interface) → zero dependency
3. Write repository (raw SQL implementation) + test
4. Write usecase (business logic) + test
5. Write handler (HTTP wiring) + test
6. Register route in router.go
7. Manual test via curl/httpie
8. Commit: feat(scope): descriptive message
```

---

## Git Conventions

### Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production ready — no direct push |
| `develop` | Integration / staging |
| `feature/name` | Feature development |
| `bugfix/name` | Bug fixes during development |
| `hotfix/name` | Emergency production fixes |

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <message>

Types: feat, fix, refactor, test, docs, chore, perf
Scope: api, db, auth, cache, middleware, config

Examples:
feat(api): implement course list endpoint
fix(db): add missing index on user_roles
test(auth): add JWT middleware test cases
perf(cache): optimize search index build query
```

---

## API Endpoints (60+ routes)

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Health check (for Docker) |

### Docs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/docs | No | OpenAPI YAML spec |
| GET | /api/v1/swagger | No | Swagger UI |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | No | Register new user |
| POST | /api/v1/auth/login | No | Login, returns JWT |
| GET | /api/v1/users/me | Yes | Current user info |

### Cawu (Periode Akademik)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/cawu | KURIKULUM+ | Create cawu |
| GET | /api/v1/cawu | Yes | List all cawus |
| GET | /api/v1/cawu/{id} | Yes | Get cawu by ID |
| PUT | /api/v1/cawu/{id} | KURIKULUM+ | Update cawu |
| DELETE | /api/v1/cawu/{id} | KURIKULUM+ | Delete cawu |
| PUT | /api/v1/cawu/{id}/active | KURIKULUM+ | Set active cawu |
| GET | /api/v1/cawu/active/current | Yes | Get currently active cawu |
| GET | /api/v1/cawu/{cawuID}/courses | Yes | Filter courses by cawu |

### Courses (Akademik)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses?cawu_id=1 | Yes | List courses (filterable by cawu) |
| POST | /api/v1/courses | KURIKULUM+ | Create course |
| GET | /api/v1/courses/{id} | Yes | Course detail |
| PUT | /api/v1/courses/{id} | KURIKULUM+ | Update course |
| DELETE | /api/v1/courses/{id} | KURIKULUM+ | Delete course |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{course_id}/sessions | Yes | List sessions for a course |
| GET | /api/v1/sessions/{session_id} | Yes | Get session by ID |
| GET | /api/v1/sessions/{session_id}/materials | Yes | Get materials for a session |
| POST | /api/v1/courses/{course_id}/sessions | KURIKULUM+ | Create session |
| PUT | /api/v1/sessions/{session_id} | KURIKULUM+ | Update session |
| DELETE | /api/v1/sessions/{session_id} | KURIKULUM+ | Delete session |

### Materials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{course_id}/materials | Yes | Materials by course |
| POST | /api/v1/materials | KURIKULUM+ | Add material |
| PUT | /api/v1/materials/{material_id} | KURIKULUM+ | Update material |
| DELETE | /api/v1/materials/{material_id} | KURIKULUM+ | Delete material |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{course_id}/tasks | Yes | List tasks for a course |
| POST | /api/v1/courses/{course_id}/tasks | KURIKULUM+ | Create task |
| GET | /api/v1/tasks/{id} | Yes | Get task by ID |
| PUT | /api/v1/tasks/{id} | KURIKULUM+ | Update task |
| DELETE | /api/v1/tasks/{id} | KURIKULUM+ | Delete task |
| PATCH | /api/v1/tasks/{id}/progress | Yes | Toggle task completion |
| GET | /api/v1/tasks/progress | Yes | Get progress by current user |
| GET | /api/v1/tasks/{id}/progress | Yes | Get progress by task |
| GET | /api/v1/tasks/{id}/detail | KURIKULUM+ | Get task detail (admin) |

### Task Monitoring (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/tasks/{id}/monitoring | KURIKULUM+ | Progress summary per task |
| GET | /api/v1/courses/{course_id}/tasks/monitoring | KURIKULUM+ | Progress summary per course |

### Grades (Kalkulator IPK)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/grades | Yes | Create grade |
| POST | /api/v1/courses/{course_id}/grades/bulk | Yes | Bulk create grades |
| GET | /api/v1/grades | Yes | Get IPK data |
| GET | /api/v1/grades/gpa | Yes | Calculate GPA |
| GET | /api/v1/grades/course | Yes | Get grades for course |
| PUT | /api/v1/grades | Yes | Update grade |
| PUT | /api/v1/grades/{course_id} | Yes | Update grade by course |

### Grade Components

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/courses/{course_id}/grade-components | KURIKULUM+ | Create grade component |
| GET | /api/v1/courses/{course_id}/grade-components | Yes | List grade components |
| PUT | /api/v1/grade-components/{id} | KURIKULUM+ | Update grade component |
| DELETE | /api/v1/grade-components/{id} | KURIKULUM+ | Delete grade component |

### Questions (Exam System)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{course_id}/questions | Yes | List questions for a course |
| POST | /api/v1/questions | KURIKULUM+ | Add question |
| GET | /api/v1/questions/{id} | Yes | Get question by ID |
| PUT | /api/v1/questions/{id} | KURIKULUM+ | Update question |
| DELETE | /api/v1/questions/{id} | KURIKULUM+ | Delete question |
| POST | /api/v1/questions/{id}/submit | Yes | Submit exam answers |
| GET | /api/v1/questions/{id}/submissions | KURIKULUM+ | Get exam submissions |
| GET | /api/v1/users/me/submissions | Yes | Get current user submissions |

### Topics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{course_id}/topics-with-sessions | Yes | Topics with sessions |
| POST | /api/v1/courses/{course_id}/topics | KURIKULUM+ | Create topic |
| GET | /api/v1/courses/{course_id}/topics | Yes | List topics by course |
| GET | /api/v1/topics/{id} | Yes | Get topic by ID |
| GET | /api/v1/topics/{id}/details | Yes | Topic with sessions+materials |
| PUT | /api/v1/topics/{id} | KURIKULUM+ | Update topic |
| DELETE | /api/v1/topics/{id} | KURIKULUM+ | Delete topic |
| POST | /api/v1/topics/{id}/sessions | KURIKULUM+ | Assign session to topic |
| DELETE | /api/v1/topics/{id}/sessions/{session_id} | KURIKULUM+ | Remove session from topic |
| PUT | /api/v1/topics/reorder | KURIKULUM+ | Reorder topics |

### Events (Kalender Akademik)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/events | Yes | List all events |
| GET | /api/v1/events/upcoming | Yes | Get upcoming events |
| GET | /api/v1/events/{id} | Yes | Get event by ID |
| POST | /api/v1/events | KURIKULUM+ | Create event |
| PUT | /api/v1/events/{id} | KURIKULUM+ | Update event |
| DELETE | /api/v1/events/{id} | KURIKULUM+ | Delete event |

### Calendar Events (Kalender Baru)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/calendar | Yes | List all calendar events |
| GET | /api/v1/calendar/active | Yes | Get active sessions |
| GET | /api/v1/calendar/upcoming | Yes | Get upcoming events |
| GET | /api/v1/calendar/{id} | Yes | Get calendar event by ID |
| POST | /api/v1/calendar | KURIKULUM+ | Create calendar event |
| PUT | /api/v1/calendar/{id} | KURIKULUM+ | Update calendar event |
| DELETE | /api/v1/calendar/{id} | KURIKULUM+ | Delete calendar event |
| PATCH | /api/v1/calendar/{id}/active | KURIKULUM+ | Set active session |

### Schedules (Jadwal)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/schedules | Yes | List all schedules |
| GET | /api/v1/schedules/active | Yes | Get active schedules |
| GET | /api/v1/schedules/{id} | Yes | Get schedule by ID |
| GET | /api/v1/courses/{course_id}/schedules | Yes | Schedules by course |
| POST | /api/v1/schedules | KURIKULUM+ | Create schedule |
| PUT | /api/v1/schedules/{id} | KURIKULUM+ | Update schedule |
| DELETE | /api/v1/schedules/{id} | KURIKULUM+ | Delete schedule |

### Board Gallery (Papan Pengumuman)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/board-gallery | Yes | Create gallery item |
| GET | /api/v1/board-gallery/session/{session_id} | Yes | Get items by session |
| GET | /api/v1/board-gallery/{id} | Yes | Get item by ID |
| PUT | /api/v1/board-gallery/{id} | Yes | Update gallery item |
| DELETE | /api/v1/board-gallery/{id} | Yes | Delete gallery item |
| PATCH | /api/v1/board-gallery/{id}/reorder | Yes | Reorder gallery items |

### Bank Soal (Arsip Ujian + Simulasi CBT)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/bank-soal/archives | KURIKULUM+ | Create exam archive |
| GET | /api/v1/bank-soal/archives | Yes | List exam archives |
| GET | /api/v1/bank-soal/archives/{id} | Yes | Get archive by ID |
| PUT | /api/v1/bank-soal/archives/{id} | KURIKULUM+ | Update exam archive |
| DELETE | /api/v1/bank-soal/archives/{id} | KURIKULUM+ | Delete exam archive |
| POST | /api/v1/bank-soal/simulations | KURIKULUM+ | Create CBT simulation |
| GET | /api/v1/bank-soal/simulations | Yes | List simulations |
| GET | /api/v1/bank-soal/simulations/{id} | Yes | Get simulation by ID |
| PUT | /api/v1/bank-soal/simulations/{id} | KURIKULUM+ | Update simulation |
| DELETE | /api/v1/bank-soal/simulations/{id} | KURIKULUM+ | Delete simulation |
| POST | /api/v1/bank-soal/simulations/{simulation_id}/questions | KURIKULUM+ | Add question to simulation |
| GET | /api/v1/bank-soal/simulations/{simulation_id}/questions | Yes | Get simulation questions |
| PUT | /api/v1/bank-soal/questions/{id} | KURIKULUM+ | Update simulation question |
| DELETE | /api/v1/bank-soal/questions/{id} | KURIKULUM+ | Delete simulation question |

### Excel Import/Export

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/export/courses | KURIKULUM+ | Export courses to Excel |
| GET | /api/v1/export/template | KURIKULUM+ | Export import template |
| GET | /api/v1/export/grades | Yes | Export grades to Excel |
| POST | /api/v1/import/courses | KURIKULUM+ | Import courses from Excel |
| POST | /api/v1/import/preview | KURIKULUM+ | Preview import data |

### Search (Omnisearch)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/search/index | Yes | Full search index (cached, ETag) |
| GET | /api/v1/search | Yes | Search query |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/dashboard/summary | Yes | Today schedule + pending tasks + active events |

### User Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/users | KURIKULUM+ | List all users |
| GET | /api/v1/users/{id} | KURIKULUM+ | Get user detail |
| PUT | /api/v1/users/{id}/role | KURIKULUM+ | Update user role |
| GET | /api/v1/roles | Yes | List available roles |
