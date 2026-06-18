# PPTI Academic Management App

Platform manajemen akademik berbasis web (PWA) untuk ekosistem kelas PPTI dengan sistem Catur Wulan (Cawu).

## Fitur MVP

- 📚 **Modul Kurikulum** - Manajemen mata kuliah, sesi, dan materi pembelajaran
- 📅 **Kalender Akademik** - Jadwal ujian, tugas, dan kegiatan akademik
- 🧮 **Kalkulator IPK** - Hitung dan pantau performa akademik real-time
- 🔍 **Global Search** - Pencarian cepat matkul, sesi, dan tugas
- ✅ **Task Tracking** - Pantau progres tugas dengan checklist
- 📝 **Bank Soal** - Latihan soal dan simulasi ujian
- 📊 **Monitoring** - Dashboard monitoring tugas untuk admin/komti
- 🔐 **Role-Based Access** - Kontrol akses berdasarkan role (Super Admin, Kurikulum, Sekretaris, Komti, Wakomti, Warga Lokal)
- 📱 **PWA Support** - Bisa di-install dan akses offline untuk konten yang sudah di-cache

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Shadcn/ui + Tailwind CSS
- **State:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **PDF Viewer:** react-pdf
- **HTTP:** Axios
- **Icons:** Lucide React

## Prerequisites

- Node.js 22+ 
- npm 10+

## Setup & Development

1. **Clone repository**
```bash
git clone <repo-url>
cd ppti-academic-management-app/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local dan sesuaikan NEXT_PUBLIC_API_URL
```

4. **Run development server**
```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

## Build & Production

```bash
npm run build
npm start
```

## Docker

Build dan jalankan dengan Docker:

```bash
docker build -t ppti-frontend .
docker run -p 3000:3000 ppti-frontend
```

Atau gunakan docker-compose dari root project:

```bash
docker-compose up -d
```

## API Endpoints

Aplikasi ini membutuhkan backend API dengan endpoint berikut:

### ✅ Sudah Diimplementasi
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/users/me` - Get current user
- `GET/POST/PUT/DELETE /api/courses` - CRUD mata kuliah
- `GET/POST/PUT/DELETE /api/sessions` - CRUD sesi
- `GET/POST/PUT/DELETE /api/materials` - CRUD materi
- `GET/POST/PUT/DELETE /api/tasks` - CRUD tugas
- `PATCH /api/tasks/{id}/progress` - Update progress tugas

### ⚠️ Belum Ada (Menggunakan Mock Data)
- `GET /api/dashboard/summary` - Dashboard summary
- `GET/POST/PUT/DELETE /api/events` - CRUD event kalender
- `GET/PUT /api/ipk` - IPK calculator
- `GET/POST/PUT/DELETE /api/questions` - CRUD bank soal
- `GET /api/tasks/{id}/progress/all` - Monitoring tugas semua mahasiswa
- `GET /api/search` - Global search
- `PUT /api/users/{id}/role` - Update role user

## Role Access Matrix

| Fitur | Super Admin | Kurikulum | Sekretaris | Komti/Wakomti | Warga Lokal |
|-------|-------------|-----------|------------|---------------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Akademik (Read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD Kurikulum | ✅ | ✅ | ❌ | ❌ | ❌ |
| CRUD Kalender | ✅ | ❌ | ✅ | ❌ | ❌ |
| Monitoring Tugas | ✅ | ✅ | ✅ | ✅ | ❌ |
| Kalkulator IPK | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bank Soal | ✅ | ✅ | ✅ | ✅ | ✅ |

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   └── (main)/            # Main app pages (protected)
│   │       ├── dashboard/
│   │       ├── akademik/
│   │       ├── ipk/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                # Shadcn UI components
│   │   ├── layout/            # Layout components (header, sidebar)
│   │   ├── search/            # Global search
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── akademik/          # Academic components
│   │   ├── tugas/             # Task components
│   │   ├── bank-soal/         # Question bank components
│   │   ├── ipk/               # GPA calculator components
│   │   └── admin/             # Admin panel components
│   ├── lib/
│   │   ├── api/               # API client & functions
│   │   │   └── mocks/         # Mock data untuk endpoint yang belum ada
│   │   ├── stores/            # Zustand stores
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── constants/         # Constants & config
│   └── types/                 # TypeScript types
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── offline.html           # Offline fallback page
│   └── icons/                 # PWA icons
├── Dockerfile                 # Docker config
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=PPTI Academic
```

## Contributing

1. Buat branch baru: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: add your feature"`
3. Push ke branch: `git push origin feature/your-feature`
4. Buat Pull Request

## License

Internal use only - PPTI Academic

---

**Dibuat dengan ❤️ oleh Tim PPTI**
