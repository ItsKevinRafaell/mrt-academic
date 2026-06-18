# Frontend Setup Complete ✅

## Changes Made

### Priority 1 - Breaking Issues (FIXED)

#### 1. API Endpoints: `/api/*` → `/api/v1/*`
- Updated `src/lib/api/client.ts` baseURL to `http://localhost:9090/api/v1`
- Fixed 13 API modules (45+ endpoints):
  - auth.ts, courses.ts, sessions.ts, materials.ts
  - tasks.ts, questions.ts, grades.ts (ipk.ts)
  - events.ts, search.ts, users.ts, monitoring.ts
  - dashboard.ts

#### 2. Role Types: lowercase → UPPERCASE
- Updated `src/types/user.ts` Role type definition
- Fixed `src/lib/constants/roles.ts`
- Now matches backend: SUPER_ADMIN, KURIKULUM, SEKRETARIS, KOMTI, WAKOMTI, MAHASISWA

#### 3. Port: 8080 → 9090
- Updated `.env.local.example`
- Updated `docker-compose.yml` frontend environment
- BaseURL: `http://localhost:9090/api/v1`

### Priority 2 - Cleanup (FIXED)

#### 4. Branding: PPTI → MRT
- `package.json` name: mrt-academic-app
- `public/manifest.json`: MRT Academic
- `src/app/layout.tsx`: metadata title & description
- `src/app/(auth)/login/page.tsx`: "MRT Academic"
- `src/app/(auth)/register/page.tsx`: "MRT Academic"
- `src/components/layout/header.tsx`: mobile logo "MRT"
- `src/components/layout/sidebar.tsx`: logo "M" + "MRT Academic" + footer
- localStorage keys: mrt_token, mrt_user, mrt_role

#### 5. Auth Logic: Merged
- `src/lib/api/auth.ts`: API calls only (login, register, getMe)
- `src/lib/stores/auth-store.ts`: State management (hydrate, setUser, logout, getToken)
- No more duplication

#### 6. Skeleton Component: Added
- `src/components/ui/skeleton.tsx`

#### 7. Error Handling: Fixed
- Removed silent catches in `src/app/(main)/akademik/[id]/page.tsx`
- Fixed `err: any` types in login/register pages
- Added user-friendly alerts

#### 8. Color Scheme: Verified ✓
- Blue primary: 217° HSL (already correct!)

#### 9. Next.js 14 Warning: Fixed
- Moved `themeColor` from metadata to viewport export in layout.tsx

## Current Status

### Running Servers
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **Backend**: http://localhost:9090 (Go server)
- **Database**: PostgreSQL (via Docker)

### Health Checks
```bash
# Backend health
curl http://localhost:9090/api/health
# Result: {"database":"ok","status":"ok"}

# Frontend
curl http://localhost:3000/login
# Result: MRT Academic login page ✓
```

### File Statistics
- API modules: 13 files
- UI components: 14 files  
- Pages: 15 files
- Total files updated: ~25
- Lines changed: ~200

## How to Use

### Development Mode

1. **Start Backend**
```bash
cd /home/kevin/MRT/backend
export PATH=$PATH:/usr/local/go/bin
PORT=9090 ./bin/mrt-server
```

2. **Start Frontend**
```bash
cd /home/kevin/MRT/frontend
npm run dev
```

3. **Access**
- Frontend: http://localhost:3000
- Backend API: http://localhost:9090/api/v1
- Backend Swagger: http://localhost:9090/api/swagger

### Production Mode (Docker)

```bash
cd /home/kevin/MRT
docker compose up -d
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:9090
- Adminer: http://localhost:8081
- PostgreSQL: localhost:5432

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:9090/api/v1
NEXT_PUBLIC_APP_NAME=MRT Academic
```

### Backend (.env)
```env
PORT=9090
DATABASE_URL=postgres://mrt:secret@localhost:5432/mrt_db?sslmode=disable
JWT_SECRET=your-secret-key-change-in-production
```

## Testing Frontend-Backend Integration

### 1. Test Login Flow
```bash
# First, create a user via backend API or database
# Then test login from frontend at http://localhost:3000/login
```

### 2. Test API Endpoints
```bash
# Login
curl -X POST http://localhost:9090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get courses (requires JWT token)
curl http://localhost:9090/api/v1/courses \
  -H "Authorization: Bearer <token>"
```

### 3. Test Frontend Pages
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register
- Dashboard: http://localhost:3000/dashboard (requires auth)
- Akademik: http://localhost:3000/akademik (requires auth)
- IPK Calculator: http://localhost:3000/ipk (requires auth)

## Next Steps

1. ✅ ~~Fix API endpoints~~
2. ✅ ~~Fix role types~~
3. ✅ ~~Fix port~~
4. ✅ ~~Rename branding~~
5. ✅ ~~Merge auth logic~~
6. ✅ ~~Add Skeleton component~~
7. ✅ ~~Fix error handling~~
8. ✅ ~~Verify color scheme~~
9. ⏭️ **Task #9**: Production Dockerfile (backend)
10. ⏭️ **E2E Testing**: Test full user flow
11. ⏭️ **Deployment**: Deploy to VPS

## Notes

- Frontend uses Next.js 14 App Router
- Backend uses Go with clean architecture
- Authentication via JWT (24h expiry)
- Database: PostgreSQL 16
- All API endpoints prefixed with `/api/v1`
- Role-based access control (RBAC) implemented
- Search index cached in backend memory (5 min TTL)
- Dashboard summary cached (1 min TTL)

## Troubleshooting

### Backend won't start
```bash
# Check if port 9090 is in use
lsof -i :9090
# Kill the process
pkill -f mrt-server
```

### Frontend shows old branding
```bash
# Clear Next.js cache
cd /home/kevin/MRT/frontend
rm -rf .next
npm run dev
```

### CORS errors
Backend already has CORS middleware enabled. Check backend logs for details.

### API returns 404
- Verify baseURL: `http://localhost:9090/api/v1`
- Check backend is running on port 9090
- Verify endpoint path (no `/api` prefix in individual calls)

## Success Criteria ✓

- [x] All API endpoints updated to `/api/v1`
- [x] Role types match backend (UPPERCASE)
- [x] Port configured to 9090
- [x] All PPTI branding → MRT
- [x] Auth logic merged (no duplication)
- [x] Skeleton component added
- [x] Error handling improved
- [x] Blue color scheme verified
- [x] Frontend runs without errors
- [x] Backend health check passes
- [x] Login page renders correctly
- [x] Docker Compose updated
