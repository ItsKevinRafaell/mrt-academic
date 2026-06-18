# Context Prompt untuk Sesi Baru - MRT Academic Platform

## Project Overview
MRT Academic Platform - Sistem akademik untuk manajemen mata kuliah, tugas, dan perhitungan IPK dengan multi-component grading system.

## Tech Stack

### Backend (Go)
- **Framework:** Chi router
- **Database:** PostgreSQL 16
- **Container:** Docker (postgres:16-alpine, adminer)
- **Port:** 8080
- **Auth:** JWT token dengan bcrypt password hashing

### Frontend (Next.js 14)
- **Framework:** Next.js 14 App Router
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand (auth store)
- **Port:** 3000

## Project Structure

```
/home/kevin/MRT/
├── backend/
│   ├── cmd/api/main.go              # Entry point
│   ├── internal/
│   │   ├── domain/                  # Domain models
│   │   ├── repository/postgres/     # Database queries
│   │   ├── usecase/                 # Business logic
│   │   └── delivery/http/           # HTTP handlers & router
│   └── migrations/                  # SQL migrations
├── frontend/
│   ├── src/app/                     # Next.js App Router pages
│   │   ├── (main)/                  # Protected routes
│   │   │   ├── akademik/           # Course list & detail
│   │   │   ├── ipk/                # IPK calculator
│   │   │   ├── admin/              # Admin panel
│   │   │   └── topik/              # Topic detail
│   │   └── (auth)/                  # Public auth routes
│   ├── src/components/              # Reusable components
│   ├── src/lib/api/                 # API client functions
│   └── src/types/                   # TypeScript types
├── PROGRESS_SESSION.md              # Detailed progress notes
└── CLAUDE.md                        # Project conventions
```

## Current Status (16 Juni 2026)

### ✅ Completed Features
1. **Authentication** - Login/register dengan role-based access
2. **Course Management** - CRUD courses dengan cawu filtering
3. **Topic & Session Management** - Hierarchical structure (course > topics > sessions)
4. **Materials** - Upload/link materials (pdf, video, link, image)
5. **Tasks** - Task management dengan progress tracking
6. **Grade Components** - Setup UTS/UAS/Tugas dengan weights (KURIKULUM only)
7. **IPK Calculator** - Input grades per component, auto-calculate weighted average
8. **Admin Panel** - Per-matkul management (topics, sessions, materials, grade components)
9. **Role-based Access** - MAHASISWA, KOMTI, WAKOMTI, KURIKULUM, SUPER_ADMIN

### 🐛 Known Issues (Fixed)
- ✅ Material type null check (toUpperCase crash)
- ✅ Session numbering (Sesi 0 → 1,2,3)
- ✅ Grade components UI missing
- ✅ Login password hash invalid
- ✅ Backend null array responses

### 🔄 Work in Progress
- Topic detail page with photo gallery (created but not fully tested)
- Grade input workflow testing
- End-to-end testing

## Database Schema (Key Tables)

### users
```sql
- id (uuid, PK)
- nim (varchar, unique)
- full_name (varchar)
- email (varchar, unique)
- password_hash (varchar)
```

### user_roles
```sql
- user_id (uuid, FK)
- role (enum: MAHASISWA, KURIKULUM, SEKRETARIS, KOMTI, WAKOMTI, SUPER_ADMIN)
```

### cawu
```sql
- id (int, PK)
- name (varchar)
- year (int)
- semester (int)
- is_active (boolean)
```

### courses
```sql
- id (int, PK)
- code (varchar, unique)
- name (varchar)
- sks (int)
- description (text)
- cawu_id (int, FK)
```

### topics
```sql
- id (int, PK)
- course_id (int, FK)
- title (varchar)
- description (text)
- order_number (int)
```

### sessions
```sql
- id (int, PK)
- course_id (int, FK)
- topic_id (int, FK, nullable)
- number (int)
- title (varchar)
- description (text)
```

### grade_components
```sql
- id (int, PK)
- course_id (int, FK)
- name (varchar)
- weight (numeric)
- type (varchar)
```

### grades
```sql
- id (int, PK)
- user_id (uuid, FK)
- course_id (int, FK)
- component_id (int, FK)
- score (numeric)
- grade (varchar)
```

## API Endpoints (Key)

### Auth
- `POST /api/v1/auth/login` - Login (return JWT token)
- `GET /api/v1/users/me` - Get current user

### Courses
- `GET /api/v1/courses` - List courses (filter by active cawu)
- `GET /api/v1/courses/{id}` - Get course detail
- `POST /api/v1/courses` - Create course (KURIKULUM+)
- `PUT /api/v1/courses/{id}` - Update course (KURIKULUM+)

### Topics & Sessions
- `GET /api/v1/courses/{id}/topics` - List topics for course
- `GET /api/v1/courses/{id}/topics-with-sessions` - Topics with sessions
- `POST /api/v1/topics` - Create topic (KURIKULUM+)
- `POST /api/v1/sessions` - Create session (KURIKULUM+)

### Grade Components
- `GET /api/v1/courses/{id}/grade-components` - List components
- `POST /api/v1/courses/{id}/grade-components` - Create component (KURIKULUM+)
- `PUT /api/v1/grade-components/{id}` - Update component (KURIKULUM+)
- `DELETE /api/v1/grade-components/{id}` - Delete component (KURIKULUM+)

### Grades
- `GET /api/v1/grades` - Get user's grades
- `POST /api/v1/grades` - Submit/update grade

### Tasks
- `GET /api/v1/courses/{id}/tasks` - List tasks
- `POST /api/v1/tasks` - Create task (KURIKULUM+)
- `PATCH /api/v1/tasks/{id}/progress` - Update progress (MAHASISWA)

## Test Data (Seeded)

### Users (Password: `password123` for all)
- **KURIKULUM:** testuser@mrt.dev (Test User Kurikulum)
- **MAHASISWA:** budi.santoso@mhs.mrt.ac.id (Budi Santoso)
- **MAHASISWA:** siti.rahayu@mhs.mrt.ac.id (Siti Rahayu)
- **MAHASISWA:** ahmad.wijaya@mhs.mrt.ac.id (Ahmad Wijaya)
- **MAHASISWA:** dewi.lestari@mhs.mrt.ac.id (Dewi Lestari)
- **MAHASISWA:** rizky.pratama@mhs.mrt.ac.id (Rizky Pratama)
- **MAHASISWA:** putri.amanda@mhs.mrt.ac.id (Putri Amanda)
- **KOMTI:** dimas.kurniawan@mhs.mrt.ac.id (Dimas Kurniawan)
- **WAKOMTI:** rina.sulistyawati@mhs.mrt.ac.id (Rina Sulistyawati)

### Cawu
- **Cawu 3 2024** (ACTIVE) - 5 courses
- **Cawu 4 2025** - 5 courses

### Courses (10 total)
**Cawu 3:**
1. PROGWEB - Pemrograman Web (3 SKS)
2. BASISDATA - Basis Data (3 SKS)
3. JARKOM - Jaringan Komputer (3 SKS)
4. SISTOP - Sistem Operasi (2 SKS)
5. AI - Kecerdasan Buatan (3 SKS)

**Cawu 4:**
6. PROGMOD - Pemrograman Mobile (3 SKS)
7. KEAMJAR - Keamanan Jaringan (2 SKS)
8. ML - Machine Learning (3 SKS)
9. CLOUD - Cloud Computing (3 SKS)
10. PROAK - Proyek Akhir (4 SKS)

### Other Data
- 20 topics (2 per course)
- 40 sessions (4 per course, numbered 1-4)
- 10 materials
- 20 tasks (2 per course)
- 30 grade components (3 per course: UTS 30%, UAS 40%, Tugas 30%)

## How to Run

### Backend
```bash
cd /home/kevin/MRT/backend
./mrt-server  # Binary sudah ada
# Or: go run cmd/api/main.go
```

### Frontend
```bash
cd /home/kevin/MRT/frontend
npm run dev
```

### Database
```bash
cd /home/kevin/MRT
docker-compose up -d postgres
```

### Check Status
```bash
# Backend
curl http://localhost:8080/api/health

# Frontend
curl http://localhost:3000

# Database
docker exec -it mrt-postgres psql -U mrt -d mrt_db
```

## Common Tasks

### Add new migration
```bash
# Create file: backend/migrations/XXX_description.sql
# Run: docker exec -i mrt-postgres psql -U mrt -d mrt_db < backend/migrations/XXX_description.sql
```

### Test login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@mrt.dev","password":"password123"}'
```

### Check database data
```bash
docker exec -it mrt-postgres psql -U mrt -d mrt_db
# Then: SELECT * FROM courses;
# Or: SELECT * FROM users;
```

## Next Steps (Potential)

### High Priority
1. **Test end-to-end** - Login sebagai different roles, test semua fitur
2. **Fix bugs** - Jika ada error saat testing
3. **Grade calculation** - Verify IPK calculation correct
4. **Photo upload** - Test upload foto di topic detail page

### Medium Priority
5. **UI/UX improvements** - Polish tampilan, fix layout issues
6. **Validation** - Add input validation (form fields, API params)
7. **Error handling** - Better error messages untuk user
8. **Loading states** - Add skeleton loaders

### Low Priority
9. **Export/Import** - Export grade data ke Excel/PDF
10. **Search & Filter** - Filter courses by semester, search tasks
11. **Notifications** - Notify students saat ada tugas baru
12. **Analytics** - Dashboard dengan statistik

## Important Notes

### Password Hash
Semua user pakai password `password123` dengan bcrypt hash:
```
$2a$10$DpquUUkWvLL.PRvMK.6gDOcu0YHrVROdQr5ot6vvVT9kSc9PRXAqu
```

### Active Cawu
Cawu 3 2024 adalah active cawu. Untuk switch:
```sql
UPDATE cawu SET is_active = FALSE;
UPDATE cawu SET is_active = TRUE WHERE name = 'Cawu 4 2025';
```

### Role Permissions
- **MAHASISWA**: View courses/tasks/materials, submit task progress, input grades
- **KOMTI/WAKOMTI**: MAHASISWA + access admin panel
- **KURIKULUM**: Full access + manage courses/sessions/tasks/grade components
- **SUPER_ADMIN**: KURIKULUM + manage users/cawu

### Build Frontend
```bash
cd /home/kevin/MRT/frontend
npm run build  # Build production
npm run start  # Start production server
```

## Troubleshooting

### Login failed
- Check backend running: `ps aux | grep mrt-server`
- Check database: `docker exec mrt-postgres psql -U mrt -d mrt_db -c "SELECT email FROM users LIMIT 5;"`
- Verify password hash: Update dengan hash yang valid

### Frontend build error
- Check TypeScript errors: `npm run build`
- Check imports: Pastikan semua types ada di `src/types/`
- Clear cache: `rm -rf .next && npm run build`

### Database migration error
- Check schema: `docker exec mrt-postgres psql -U mrt -d mrt_db -c "\d table_name"`
- Rollback: Restore dari backup atau truncate tables

## References
- **Progress Notes:** `/home/kevin/MRT/PROGRESS_SESSION.md`
- **Project Conventions:** `/home/kevin/MRT/CLAUDE.md`
- **Backend Docs:** `/home/kevin/MRT/backend/README.md`
- **Frontend Docs:** `/home/kevin/MRT/frontend/README.md`

---
**Last Updated:** 16 Juni 2026  
**Status:** Ready for continuation
