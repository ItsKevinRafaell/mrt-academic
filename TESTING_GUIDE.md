# MRT Academic - Local Testing Guide

## Prerequisites

1. **Docker Desktop** - untuk PostgreSQL dan Adminer
2. **Go 1.21+** - untuk backend
3. **Node.js 18+** - untuk frontend
4. **Browser** - untuk akses aplikasi

## Quick Start

### 1. Start Database (Docker)

```bash
cd /home/kevin/MRT
docker compose up -d postgres adminer
```

**Services:**
- PostgreSQL: `localhost:5432`
- Adminer (DB GUI): `http://localhost:8081`

### 2. Run Migrations

```bash
cd /home/kevin/MRT/backend/migrations
for f in *.sql; do
  docker exec -i mrt-postgres psql -U mrt -d mrt_db < "$f"
done
```

### 3. Start Backend

```bash
cd /home/kevin/MRT/backend
go run cmd/server/main.go
```

Backend akan jalan di: `http://localhost:9090`

**Test health:**
```bash
curl http://localhost:9090/api/health
```

### 4. Start Frontend

```bash
cd /home/kevin/MRT/frontend
npm install  # first time only
npm run dev
```

Frontend akan jalan di: `http://localhost:3000`

## Testing the App

### Login Credentials

**Admin User (SUPER_ADMIN):**
- Email: `test_1781485667@mrt.dev`
- Password: `test123456`

**Regular User (MAHASISWA):**
- Register new account di `/register`

### Test Scenarios

#### 1. Auth Flow
- ✅ Register new user: `http://localhost:3000/register`
- ✅ Login: `http://localhost:3000/login`
- ✅ Auto-redirect ke dashboard setelah login

#### 2. Student Features (MAHASISWA)
- ✅ View courses: `/akademik`
- ✅ View course details (materials, tasks, questions)
- ✅ Submit task progress
- ✅ View grades: `/ipk`
- ✅ Search courses/tasks (top navbar)

#### 3. Admin Features (SUPER_ADMIN)
- ✅ Manage courses: `/admin/curriculum`
- ✅ Create/edit/delete courses, sessions, materials, tasks
- ✅ Manage calendar events: `/admin/calendar`
- ✅ View task monitoring: `/admin/monitoring`
- ✅ Manage users: `/admin/users`

#### 4. Dashboard
- ✅ View summary: `/dashboard`
- ✅ See enrolled courses, pending tasks, upcoming events

## API Testing with curl

### Get JWT Token
```bash
TOKEN=$(curl -s -X POST http://localhost:9090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_1781485667@mrt.dev","password":"test123456"}' | jq -r '.data.token')
echo $TOKEN
```

### Test Protected Endpoints
```bash
# Get current user
curl http://localhost:9090/api/v1/users/me -H "Authorization: Bearer $TOKEN"

# List courses
curl http://localhost:9090/api/v1/courses -H "Authorization: Bearer $TOKEN"

# Get dashboard
curl http://localhost:9090/api/v1/dashboard/summary -H "Authorization: Bearer $TOKEN"

# Search
curl "http://localhost:9090/api/v1/search?q=Binary" -H "Authorization: Bearer $TOKEN"
```

## Database Inspection

### Using Adminer (Web GUI)
1. Open: `http://localhost:8081`
2. Login:
   - Server: `postgres`
   - Username: `mrt`
   - Password: `mrt123`
   - Database: `mrt_db`

### Using psql (CLI)
```bash
docker exec -it mrt-postgres psql -U mrt -d mrt_db

# Useful queries:
SELECT * FROM users;
SELECT * FROM courses;
SELECT * FROM user_roles;
\dt  # list tables
\q   # quit
```

## Troubleshooting

### Backend won't start
```bash
# Check if port 9090 is in use
lsof -i :9090

# Kill process
kill -9 <PID>
```

### Frontend won't start
```bash
# Clear cache
cd /home/kevin/MRT/frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Database connection failed
```bash
# Check if postgres is running
docker compose ps

# Restart postgres
docker compose restart postgres

# Check logs
docker compose logs postgres
```

### CORS errors
Backend sudah include CORS headers. Pastikan frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:9090/api/v1
```

## Environment Variables

### Backend (.env)
```env
PORT=9090
DB_HOST=localhost
DB_PORT=5432
DB_USER=mrt
DB_PASSWORD=mrt123
DB_NAME=mrt_db
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:9090/api/v1
NEXT_PUBLIC_APP_NAME=MRT Academic
```

## Stop All Services

```bash
# Stop backend & frontend
pkill -f "go run cmd/server"
pkill -f "npm run dev"

# Stop docker containers
docker compose down
```

## Next Steps

After testing locally:
1. ✅ All features working?
2. ✅ No console errors?
3. ✅ Database operations correct?
4. Ready for VPS deployment!
