# Next Session Prompt - Smart Scheduling Implementation

## Quick Start
Copy and paste this prompt to continue implementation:

---

Lanjutkan implementasi Smart Scheduling System di MRT Academic Platform.

**Baca file-file ini dulu:**
- `/home/kevin/MRT/PROGRESS_SESSION_17_JUNI.md` - Progress session sebelumnya
- `/home/kevin/MRT/CLAUDE.md` - Project context dan guidelines
- `/home/kevin/MRT/CLAUDE.md` - Project structure dan conventions

## Context
- Frontend: http://localhost:3000 (Next.js 14 + Tailwind + shadcn/ui)
- Backend: http://localhost:9090 (Go 1.21 + Clean Architecture)
- Database: PostgreSQL (sudah running)
- Build status: Berhasil, hanya ada ESLint warnings (tidak blocking)

## Tasks Prioritas Tinggi (Selesaikan Sesuai Urutan)

### 1. Backend Implementation untuk Bank Soal (URGENT)
Buat backend API untuk Bank Soal:

**Database Schema:**
```sql
-- Migration: 018_add_bank_soal.sql
CREATE TABLE IF NOT EXISTS exam_archives (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  exam_type VARCHAR(50) NOT NULL, -- 'uts', 'uas', 'kuis', 'tryout'
  year INTEGER NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) DEFAULT 'pdf',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_questions (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- 'multiple_choice', 'essay'
  options JSONB, -- JSON array for multiple choice options
  correct_answer TEXT, -- For auto-grading
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_archives_course ON exam_archives(course_id);
CREATE INDEX IF NOT EXISTS idx_simulations_course ON simulations(course_id);
CREATE INDEX IF NOT EXISTS idx_simulation_questions_simulation ON simulation_questions(simulation_id);
```

**Backend Files to Create:**
- `backend/internal/domain/exam_archive.go` - Domain model
- `backend/internal/domain/simulation.go` - Domain model
- `backend/internal/repository/postgres/exam_archive_repo.go` - Repository
- `backend/internal/repository/postgres/simulation_repo.go` - Repository
- `backend/internal/usecase/bank_soal_usecase.go` - Business logic
- `backend/internal/delivery/http/handler/bank_soal_handler.go` - HTTP handlers

**API Endpoints:**
```
POST   /api/v1/bank-soal/archives           - Create exam archive
GET    /api/v1/bank-soal/archives           - Get all archives (filter by course_id)
GET    /api/v1/bank-soal/archives/:id       - Get archive by ID
PUT    /api/v1/bank-soal/archives/:id       - Update archive
DELETE /api/v1/bank-soal/archives/:id       - Delete archive

POST   /api/v1/bank-soal/simulations           - Create simulation
GET    /api/v1/bank-soal/simulations           - Get all simulations (filter by course_id)
GET    /api/v1/bank-soal/simulations/:id       - Get simulation by ID (with questions)
PUT    /api/v1/bank-soal/simulations/:id       - Update simulation
DELETE /api/v1/bank-soal/simulations/:id       - Delete simulation

POST   /api/v1/bank-soal/simulations/:id/questions           - Add question to simulation
PUT    /api/v1/bank-soal/questions/:id                       - Update question
DELETE /api/v1/bank-soal/questions/:id                       - Delete question
```

**File Upload Handler:**
- Implementasi file upload untuk file soal (PDF/DOC)
- Gunakan multipart/form-data
- Simpan file ke `/uploads/bank-soal/`
- Return file URL setelah upload

**Seed Data:**
```sql
-- Seed data untuk testing
INSERT INTO exam_archives (course_id, title, description, exam_type, year, file_url) VALUES
(1, 'UTS Pemrograman Web 2024', 'Soal UTS mata kuliah Pemrograman Web', 'uts', 2024, '/uploads/bank-soal/uts-progweb-2024.pdf'),
(1, 'UAS Pemrograman Web 2024', 'Soal UAS mata kuliah Pemrograman Web', 'uas', 2024, '/uploads/bank-soal/uas-progweb-2024.pdf'),
(2, 'UTS Basis Data 2024', 'Soal UTS mata kuliah Basis Data', 'uts', 2024, '/uploads/bank-soal/uts-basisdata-2024.pdf');

INSERT INTO simulations (course_id, title, description, duration_minutes) VALUES
(1, 'Simulasi UTS Pemrograman Web', 'Simulasi ujian UTS Pemrograman Web', 90),
(2, 'Simulasi UTS Basis Data', 'Simulasi ujian UTS Basis Data', 90);

INSERT INTO simulation_questions (simulation_id, question_text, question_type, options, correct_answer, points) VALUES
(1, 'Apa itu HTML?', 'multiple_choice', '["HyperText Markup Language", "HyperText Markup Language", "HyperText Markup Language", "HyperText Markup Language"]', 'HyperText Markup Language', 1),
(1, 'Jelaskan perbedaan antara var, let, dan const di JavaScript', 'essay', NULL, NULL, 5);
```

### 2. CBT Simulator Implementation (URGENT)
Implementasi CBT (Computer-Based Test) simulator di frontend:

**File:** `/frontend/src/components/cbt-simulator.tsx`

**Features:**
- Countdown timer dengan warning saat 5 menit terakhir
- Question navigation (next/previous buttons)
- Question number display (1/10, 2/10, etc.)
- Multiple choice questions dengan radio buttons
- Essay questions dengan textarea
- Auto-grading untuk multiple choice
- Manual grading untuk essay (tampilkan correct answer setelah submit)
- Result display dengan total score
- Time remaining warning (red color saat < 5 menit)
- Confirmation dialog sebelum submit
- Progress bar untuk question progress

**Integration:**
- Integrate dengan Bank Soal API (`GET /api/v1/bank-soal/simulations/:id`)
- Fetch questions saat start simulation
- Submit answers ke backend
- Display results setelah submit

### 3. PDF Viewer Component (MEDIUM)
Implementasi PDF viewer component:

**File:** `/frontend/src/components/pdf-viewer.tsx`

**Library:** Gunakan `react-pdf` atau `pdfjs-dist`
```bash
npm install react-pdf
```

**Features:**
- Page navigation (previous/next)
- Zoom in/out buttons
- Fullscreen mode
- Download button
- Page number display (Page 1 of 10)
- Loading state saat loading PDF
- Error handling untuk corrupt PDF

**Integration:**
- Integrate dengan file URLs dari bank soal
- Open PDF viewer saat user klik "Buka PDF" di arsip soal

### 4. Backend Completion untuk Course Type (MEDIUM)
Update backend untuk support course_type yang sudah ditambahkan di migration `017_add_course_type.sql`:

**Files to Update:**
1. `backend/internal/repository/postgres/course_repo.go`
   - Update `Create()` untuk include course_type
   - Update `Update()` untuk include course_type
   - Update `GetAll()` untuk return course_type
   - Update `GetByID()` untuk return course_type

2. `backend/internal/usecase/course_usecase.go`
   - Update `CreateCourse()` untuk validate course_type
   - Update `UpdateCourse()` untuk include course_type

3. `backend/internal/delivery/http/handler/course_handler.go`
   - Update request struct untuk include course_type
   - Update response untuk include course_type

4. Run migration:
```bash
docker exec -i mrt-postgres psql -U mrt -d mrt_db < backend/migrations/017_add_course_type.sql
```

### 5. Bank Soal Frontend Integration (MEDIUM)
Integrate Bank Soal page dengan backend API:

**File:** `/frontend/src/app/(main)/admin/bank-soal/page.tsx`

**Changes:**
- Replace mock data dengan API calls
- Implementasi file upload untuk arsip soal
- Implementasi CRUD operations untuk simulations
- Add proper error handling dan loading states
- Add confirmation dialogs untuk delete operations

### 6. Topic Seed Data (LOW)
Generate sample topic data untuk testing:

**File:** `backend/migrations/019_seed_topics.sql`

```sql
-- Seed topics untuk setiap course
INSERT INTO topics (course_id, name, description) VALUES
(1, 'HTML & CSS', 'Fundamental HTML dan CSS'),
(1, 'JavaScript', 'JavaScript programming'),
(1, 'React', 'React framework'),
(2, 'Database Design', 'Database design fundamentals'),
(2, 'SQL', 'SQL programming'),
(3, 'Network Basics', 'Network fundamentals'),
(4, 'Process Management', 'Process management fundamentals'),
(5, 'AI Basics', 'AI fundamentals');
```

### 7. UI/UX Polish (LOW)
- Add proper error handling di semua komponen
- Add proper loading states
- Add proper empty states
- Fix ESLint warnings (useEffect dependencies)
- Add confirmation dialogs untuk delete operations
- Add success/error notifications

## Technical Requirements
- Backend: Go 1.21+ dengan clean architecture
- Frontend: Next.js 14 dengan App Router
- Database: PostgreSQL
- State Management: Zustand
- UI: shadcn/ui components
- Styling: Tailwind CSS

## Design System
- Primary Color: #1e40af (blue-800)
- Secondary Color: #3b82f6 (blue-500)
- Background: #f8fafc (slate-50)
- Border: #e2e8f0 (slate-200)
- Text: #1e293b (slate-800)

## Testing Checklist
- [ ] Test semua CRUD operations untuk Bank Soal
- [ ] Test file upload functionality
- [ ] Test CBT simulator dengan timer
- [ ] Test multiple choice auto-grading
- [ ] Test essay questions
- [ ] Test PDF viewer dengan zoom dan navigation
- [ ] Test course type tags di course cards
- [ ] Test cawu switcher
- [ ] Test live board gallery
- [ ] Test material dialog dengan image upload
- [ ] Test responsive design (mobile & desktop)

## Success Criteria
- ✅ Semua backend endpoints berfungsi dengan proper validation
- ✅ Frontend terintegrasi dengan backend tanpa error
- ✅ Semua fitur dapat diakses dan digunakan
- ✅ Tidak ada error atau crash
- ✅ UI/UX sesuai dengan design system (monochromatic blue)
- ✅ Responsive design (mobile & desktop)
- ✅ Proper error handling di semua komponen
- ✅ Proper loading states
- ✅ Proper empty states

## Notes
- Gunakan pattern yang sama dengan existing code (clean architecture)
- Follow TypeScript untuk type safety
- Gunakan proper error handling dengan try-catch
- Gunakan loading states yang proper
- Gunakan empty states yang informative
- Gunakan proper validation di backend dan frontend
- Gunakan proper error messages (user-friendly)
- Gunakan proper form validation
- Gunakan proper confirmation dialogs
- Gunakan proper success/error notifications

---

## Quick Commands

```bash
# Backend
cd /home/kevin/MRT/backend
go run cmd/main.go

# Frontend
cd /home/kevin/MRT/frontend
npm run dev

# Database migration
docker exec -i mrt-postgres psql -U mrt -d mrt_db < backend/migrations/018_add_bank_soal.sql

# Build frontend
cd /home/kevin/MRT/frontend
npm run build

# Check backend health
curl http://localhost:9090/api/health
```

## File Locations
- Backend: `/home/kevin/MRT/backend`
- Frontend: `/home/kevin/MRT/frontend`
- Database: PostgreSQL (docker container: mrt-postgres)
- Design System: `/home/kevin/MRT/frontend/src/styles/globals.css`
- Components: `/home/kevin/MRT/frontend/src/components`
- Pages: `/home/kevin/MRT/frontend/src/app`
- API: `/home/kevin/MRT/frontend/src/lib/api`

---

**Ready to continue? Start with Task 1: Backend Implementation untuk Bank Soal**
