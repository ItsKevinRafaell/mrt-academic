# MRT Backend

Academic management system for MRT ecosystem.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.23+
- jq (for pretty JSON output)

### Setup

1. **Start infrastructure**
```bash
docker compose up -d
```

2. **Run database migrations**
```bash
./scripts/db-migrate.sh
```

3. **Build & run server**
```bash
export PATH=$PATH:/usr/local/go/bin
go build -o bin/mrt-server cmd/api/main.go
./bin/mrt-server
```

Server runs on `http://localhost:8080` by default (configurable via `PORT` env var).

## API Documentation

### Live OpenAPI Spec
```bash
curl http://localhost:8080/api/docs
```

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Import to Postman/Insomnia
1. Copy output from `/api/docs` endpoint
2. Import as OpenAPI 3.0 spec in Postman or Insomnia
3. All endpoints, request/response schemas will be available

## Project Structure

```
MRT/
├── cmd/api/main.go                    # Server entrypoint
├── internal/
│   ├── config/                        # Environment configuration
│   ├── domain/                        # Business entities & interfaces
│   ├── delivery/http/                 # HTTP handlers & router
│   └── repository/postgres/           # Database layer
├── migrations/                        # SQL migration files
├── scripts/
│   └── db-migrate.sh                 # Migration runner
├── docs/
│   └── openapi.yaml                  # OpenAPI 3.0 specification
├── docker-compose.yml                # PostgreSQL + Adminer
└── CLAUDE.md                         # Architecture documentation
```

## Development

### Environment Variables
See `.env` for configuration:
- `PORT`: Server port (default: 8080)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `SEARCH_CACHE_TTL`: Search cache duration (default: 5m)
- `DASHBOARD_CACHE_TTL`: Dashboard cache duration (default: 1m)

### Database Access
- **Via Docker**: `docker exec -it mrt-postgres psql -U mrt -d mrt_db`
- **Via Adminer**: http://localhost:8081 (Server: `mrt-postgres`, User: `mrt`, Password: `secret`, DB: `mrt_db`)

### Add New Migration
1. Create file: `migrations/002_add_feature.sql`
2. Run: `./scripts/db-migrate.sh`

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation including:
- Clean Architecture layers
- Error handling patterns
- Naming conventions
- Database design
- Security guidelines

## Current Status

**Phase 1 Complete** ✅
- Docker infrastructure (PostgreSQL + Adminer)
- Database schema (10 tables)
- Health check endpoint
- OpenAPI documentation endpoint
- Configuration loader
- Database connection pool

**Phase 2 Complete** ✅
- User registration & login
- JWT token generation & validation (24-hour expiry)
- Auth middleware
- RBAC (role-based access control)
- Promote admin script

**Phase 3 Complete** ✅
- Course CRUD (admin only)
- Session management per course (admin only)
- Material management (PDF/link/video/image) (admin only)
- Task management with deadlines (admin only)
- Task progress tracking (all users)
- CORS middleware enabled

**Next: Phase 4 — Search, Grades, Events, Dashboard**
- Global search index with caching
- GPA calculator (cumulative & per cawu)
- Academic events calendar
- Dashboard summary endpoint
