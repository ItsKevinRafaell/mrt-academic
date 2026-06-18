# MRT Academic Management App

All-in-one academic management platform for MRT ecosystem. Monorepo with Go backend and Next.js frontend.

## Project Structure

```
MRT/
├── backend/                           # Go Backend (Clean Architecture)
│   ├── cmd/api/main.go                # Server entrypoint
│   ├── internal/
│   │   ├── config/                    # Environment configuration
│   │   ├── domain/                    # Business entities & interfaces
│   │   ├── delivery/http/             # HTTP handlers & router
│   │   │   ├── handler/               # Request handlers
│   │   │   └── middleware/            # Auth, CORS, RBAC
│   │   ├── usecase/                   # Business logic layer
│   │   └── repository/postgres/       # Database layer (raw SQL)
│   ├── migrations/                    # SQL migration files
│   ├── Dockerfile                     # Production backend image
│   └── go.mod
│
├── frontend/                          # Next.js Frontend (PWA)
│   └── (placeholder — pull from frontend repo)
│
├── docs/
│   └── openapi.yaml                   # OpenAPI 3.0 specification
│
├── infra/
│   └── postgres-tuning.conf           # PostgreSQL tuning for VPS
│
├── scripts/
│   ├── db-migrate.sh                  # Run all migrations
│   └── promote-admin.sh              # Promote user to super_admin
│
├── docker-compose.yml                 # All services (postgres, backend, frontend, adminer)
└── CLAUDE.md                          # Architecture documentation
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.23+ (for local backend development)
- Node.js 18+ (for local frontend development)
- jq (for pretty JSON output)

### Option A: Full Docker Setup

```bash
# Start all services (postgres, backend, frontend, adminer)
docker compose up -d

# Run migrations
./scripts/db-migrate.sh

# Promote first user to admin
./scripts/promote-admin.sh admin@test.com
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:9090
- **Swagger UI**: http://localhost:9090/api/swagger
- **Adminer**: http://localhost:8081

### Option B: Local Development

**Backend:**
```bash
cd backend
export PATH=$PATH:/usr/local/go/bin

# Build
go build -o bin/mrt-server cmd/api/main.go

# Run
./bin/mrt-server
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database (Docker only):**
```bash
docker compose up postgres adminer -d
./scripts/db-migrate.sh
```

## API Documentation

- **Swagger UI**: http://localhost:9090/api/swagger (interactive)
- **OpenAPI Spec**: http://localhost:9090/api/docs (raw YAML)
- **Health Check**: http://localhost:9090/api/health

### Import to Postman/Insomnia
1. Fetch `http://localhost:9090/api/docs`
2. Import as OpenAPI 3.0 spec
3. All endpoints, schemas, and examples available

## Endpoints Overview

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | `/api/auth/login`, `/api/auth/register` | No |
| Courses | CRUD `/api/courses` | Read: All, Write: Admin |
| Sessions | CRUD `/api/courses/{id}/sessions` | Read: All, Write: Admin |
| Materials | CRUD `/api/materials` | Read: All, Write: Admin |
| Tasks | CRUD `/api/tasks` + progress | Read: All, Write: Admin |
| Grades | `/api/grades`, `/api/grades/gpa` | Yes (student) |
| Events | CRUD `/api/events` | Read: All, Write: Admin |
| Dashboard | `/api/dashboard/summary` | Yes |
| Search | `/api/search`, `/api/search/index` | Yes |
| Docs | `/api/docs`, `/api/swagger`, `/api/health` | No |

## Environment Variables

**Backend (backend/.env):**
```env
PORT=9090
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mrt_db
DB_USER=mrt
DB_PASSWORD=secret
JWT_SECRET=change-this-in-production
SEARCH_CACHE_TTL=5m
DASHBOARD_CACHE_TTL=1m
```

**Frontend (frontend/.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:9090
```

## Database Access

- **CLI**: `docker exec -it mrt-postgres psql -U mrt -d mrt_db`
- **Adminer**: http://localhost:8081 (Server: `postgres`, User: `mrt`, Password: `secret`)

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ | Infrastructure (Docker, DB, config, health check) |
| Phase 2 | ✅ | Authentication (JWT, RBAC, register/login) |
| Phase 3 | ✅ | Core CRUD (courses, sessions, materials, tasks) |
| Phase 4 | ✅ | Advanced (grades/GPA, events, dashboard, search) |
| Phase 5 | ✅ | API Documentation (OpenAPI + Swagger UI) |
| Phase 6 | 🔄 | Testing (test files created, refactoring pending) |
| Phase 7 | ⬜ | Production deployment |

## Git Workflow

```bash
# Backend changes
cd backend && go build -o bin/mrt-server cmd/api/main.go

# Frontend changes
cd frontend && npm run build

# Full stack
docker compose up --build
```
