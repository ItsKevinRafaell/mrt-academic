# MRT Academic Management App — Backend

All-in-one class management platform for MRT ecosystem. This document is the single source of truth for backend development. Every architectural decision, convention, and constraint is recorded here.

**Last updated:** 2026-06-14

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
| Phase 4 | ✅ Complete | Advanced: Grades/GPA calculator, academic events, dashboard, global search with cache |
| Phase 5 | ✅ Complete | Unit tests (22 passing), Swagger UI, test scripts, production Dockerfile, monorepo structure |
| Phase 6 | ⬜ Next | Frontend integration, E2E testing, deployment guide, Caddyfile |

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
├── internal/
│   ├── domain/                      # Structs + interfaces (zero imports)
│   │   ├── cawu.go
│   │   ├── course.go
│   │   ├── user.go
│   │   ├── session.go
│   │   ├── material.go
│   │   ├── task.go
│   │   ├── grade.go
│   │   ├── event.go
│   │   ├── question.go
│   │   └── errors.go
│   ├── usecase/                     # Business logic
│   │   ├── auth_usecase.go
│   │   ├── course_usecase.go
│   │   ├── task_usecase.go
│   │   ├── grade_usecase.go
│   │   ├── event_usecase.go
│   │   ├── search_usecase.go
│   │   └── dashboard_usecase.go
│   ├── delivery/http/               # HTTP layer
│   │   ├── handler/
│   │   │   ├── auth_handler.go
│   │   │   ├── course_handler.go
│   │   │   ├── task_handler.go
│   │   │   ├── grade_handler.go
│   │   │   ├── event_handler.go
│   │   │   ├── search_handler.go
│   │   │   └── dashboard_handler.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   ├── ratelimit.go
│   │   │   └── rbac.go
│   │   ├── router.go
│   │   └── response.go
│   ├── repository/postgres/         # Raw SQL implementations
│   │   ├── cawu_repo.go
│   │   ├── user_repo.go
│   │   ├── course_repo.go
│   │   ├── session_repo.go
│   │   ├── material_repo.go
│   │   ├── task_repo.go
│   │   ├── grade_repo.go
│   │   ├── event_repo.go
│   │   └── question_repo.go
│   └── cache/                       # In-memory cache
│       └── search_index.go
├── migrations/                      # Numbered raw SQL files
│   ├── 001_create_cawu.sql
│   ├── 002_create_users.sql
│   ├── 003_create_user_roles.sql
│   ├── 004_create_courses.sql
│   ├── 005_create_sessions.sql
│   ├── 006_create_materials.sql
│   ├── 007_create_tasks.sql
│   ├── 008_create_task_progress.sql
│   ├── 009_create_user_grades.sql
│   ├── 010_create_academic_events.sql
│   └── 011_create_questions.sql
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

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/login | No | Login, returns JWT |
| GET | /api/v1/auth/me | Yes | Current user info |

### Cawu

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/cawu/active | Yes | Get active cawu |
| PUT | /api/v1/cawu/{id}/activate | SUPER_ADMIN | Set active cawu |

### Courses (Akademik)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses?cawu_id=1 | Yes | List courses by cawu |
| GET | /api/v1/courses/{id} | Yes | Course detail + overview |
| POST | /api/v1/courses | KURIKULUM+ | Create course |
| PUT | /api/v1/courses/{id} | KURIKULUM+ | Update course |
| DELETE | /api/v1/courses/{id} | SUPER_ADMIN | Delete course |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{id}/sessions | Yes | List sessions for a course |
| POST | /api/v1/courses/{id}/sessions | KURIKULUM+ | Create session |
| PUT | /api/v1/sessions/{id} | KURIKULUM+ | Update session |
| DELETE | /api/v1/sessions/{id} | KURIKULUM+ | Delete session |

### Materials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{id}/materials | Yes | Materials grouped by session |
| POST | /api/v1/sessions/{id}/materials | KURIKULUM+ | Add material |
| PUT | /api/v1/materials/{id} | KURIKULUM+ | Update material |
| DELETE | /api/v1/materials/{id} | KURIKULUM+ | Delete material |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{id}/tasks | Yes | List tasks for a course |
| POST | /api/v1/courses/{id}/tasks | KURIKULUM+ | Create task |
| PUT | /api/v1/tasks/{id} | KURIKULUM+ | Update task |
| DELETE | /api/v1/tasks/{id} | KURIKULUM+ | Delete task |
| PATCH | /api/v1/tasks/{id}/submit | MAHASISWA+ | Toggle task completion |

### Task Monitoring (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/tasks/{id}/progress | KURIKULUM, KOMTI, WAKOMTI, SEKRETARIS | Progress bar + split table |

### Grades (Kalkulator IPK)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/grades?cawu_id=1 | MAHASISWA+ | User grades by cawu |
| PUT | /api/v1/grades | MAHASISWA+ | Set/update grade for a course |
| GET | /api/v1/grades/summary | MAHASISWA+ | IPK cumulative + per-cawu breakdown |

### Questions (Bank Soal)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/courses/{id}/questions | Yes | List questions for a course |
| POST | /api/v1/courses/{id}/questions | KURIKULUM+ | Add question |
| PUT | /api/v1/questions/{id} | KURIKULUM+ | Update question |
| DELETE | /api/v1/questions/{id} | KURIKULUM+ | Delete question |

### Events (Kalender Akademik)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/events?cawu_id=1 | Yes | List events by cawu |
| POST | /api/v1/events | SEKRETARIS+ | Create event |
| PUT | /api/v1/events/{id} | SEKRETARIS+ | Update event |
| DELETE | /api/v1/events/{id} | SEKRETARIS+ | Delete event |

### Search (Omnisearch)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/search/index?cawu_id=1 | Yes | Full search index (cached, ETag) |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/dashboard/summary | Yes | Today schedule + pending tasks + active events |

### User Management (Super Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/users | SUPER_ADMIN | List all users |
| POST | /api/v1/users | SUPER_ADMIN | Create user |
| PUT | /api/v1/users/{id}/roles | SUPER_ADMIN | Assign role for a cawu |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Health check (for Docker) |
