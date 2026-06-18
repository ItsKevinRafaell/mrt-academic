# UI/UX Redesign Implementation Plan

## 🎯 Objective
Redesign MRT Academic ke modern SaaS aesthetic dengan Ultra-clean design, generous whitespace, dan progressive web app experience.

## 📋 Design System Requirements

### Colors
- **Background**: Slate-50 (#F8FAFC)
- **Primary Accent**: Tailwind Blue-600 (#2563EB)
- **Surface/Cards**: Pure White (#FFFFFF)
- **Borders**: 1px solid Slate-200 (#E2E8F0)
- **Text**: Slate-900 (#0F172A), Slate-600 (#475569), Slate-500 (#64748B)

### Typography
- **Font Family**: Plus Jakarta Sans (primary), Inter (fallback)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing & Radius
- **Border Radius**: rounded-xl (12px), rounded-2xl (16px)
- **Padding**: Generous whitespace (p-6, p-8)
- **Gaps**: Consistent spacing (gap-4, gap-6)

### Shadows
- **No heavy drop shadows**
- **Hover elevation**: shadow-sm → shadow-md transition

## 🔧 Implementation Phases

### Phase 1: Foundation (Layout System)
**Files to modify:**
1. `globals.css` - Update CSS variables with new color system
2. `tailwind.config.ts` - Configure custom colors and fonts
3. `layout.tsx` (main) - Remove header, implement collapsible sidebar
4. `sidebar.tsx` - New design with user profile + role badge + collapse
5. `header.tsx` - Remove or minimize (keep only mobile menu)

**Deliverables:**
- ✅ Collapsible sidebar (240px → 64px)
- ✅ User profile section with role badge
- ✅ 3 main menus: Dashboard, Akademik, Kalkulator IPK
- ✅ Admin menus (conditional based on role)
- ✅ Smooth collapse animation
- ✅ Slate-50 background throughout

### Phase 2: Global Search (Floating Command Bar)
**Files to create:**
1. `components/command-bar.tsx` - Floating search component
2. `lib/hooks/use-command-bar.ts` - Hook for Ctrl+K shortcut

**Files to modify:**
1. `layout.tsx` - Add CommandBar component
2. `global-search.tsx` - Refactor or replace

**Deliverables:**
- ✅ Floating command bar (top center)
- ✅ Ctrl+K keyboard shortcut
- ✅ Quick router for subjects/sessions
- ✅ Smooth modal animation
- ✅ Backdrop blur effect

### Phase 3: Dashboard Redesign (Bento Box)
**Files to modify:**
1. `dashboard/page.tsx` - Complete redesign
2. Create new components:
   - `dashboard/jadwal-terdekat.tsx` - Box 1 (large, top-left)
   - `dashboard/statistik-akademik.tsx` - Box 2 (medium, top-right)
   - `dashboard/tugas-checkpoint.tsx` - Box 3 (wide, bottom)

**Deliverables:**
- ✅ CSS Grid layout (2x2 on desktop, 1 column on mobile)
- ✅ Box 1: "Jadwal Terdekat" with horizontal timeline/countdown
- ✅ Box 2: "Statistik Akademik" with big GPA number
- ✅ Box 3: "Tugas & Checkpoint" with deadline cards
- ✅ White cards with Slate-200 borders
- ✅ Rounded-xl radius

### Phase 4: Akademik Redesign (Split-Pane)
**Files to modify:**
1. `akademik/page.tsx` - Split-pane layout
2. Create new components:
   - `akademik/master-list.tsx` - Left pane (30%)
   - `akademik/detail-view.tsx` - Right pane (70%)
   - `akademik/tab-materi.tsx` - Accordion for materials
   - `akademik/tab-tugas.tsx` - Task cards with progress
   - `akademik/tab-bank-soal.tsx` - Exam list

**Deliverables:**
- ✅ Split-pane layout (30% / 70%)
- ✅ Master list: scrollable subjects for active Cawu
- ✅ Selected state: subtle blue background + blue text
- ✅ Detail view: 3 minimalist tabs (Materi | Tugas | Bank Soal)
- ✅ Active tab: sliding blue bottom-border
- ✅ Mobile: stack layout (100% width)

### Phase 5: Tab Components
**Tab Materi:**
- ✅ Accordion layout grouped by Sesi
- ✅ Key-value list of files (PDF, Video, DOCS)
- ✅ Clean representative icons
- ✅ Hover effects

**Tab Tugas:**
- ✅ Task cards list
- ✅ Role logic: Kurikulum sees progress bar
- ✅ Split-table: "Sudah Selesai" | "Belum"
- ✅ Click → Slide-over drawer

**Tab Bank Soal:**
- ✅ Exam items list
- ✅ Visual indicator: "Timed Practice" vs "Normal File"
- ✅ Click → Exam mode or download

### Phase 6: Slide-Over Drawer
**Files to create:**
1. `components/drawer.tsx` - Reusable drawer component
2. `components/task-drawer.tsx` - Task-specific drawer

**Deliverables:**
- ✅ Slide from right edge
- ✅ Backdrop blur + dim
- ✅ Click outside to close
- ✅ Task details: Title, Description, Submission Link
- ✅ Prominent "Tandai Selesai" checkbox
- ✅ Smooth slide animation
- ✅ ESC key to close

### Phase 7: Additional Improvements
**Files to modify:**
1. All pages - Apply new design system
2. Forms - Modern input styling
3. Buttons - Consistent rounded-xl
4. Cards - White bg + Slate-200 border

**Deliverables:**
- ✅ Consistent typography across all pages
- ✅ Modern form inputs with Slate borders
- ✅ Rounded buttons with hover effects
- ✅ Clean empty states
- ✅ Better loading states

## 📁 File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx (MODIFY)
│   │   ├── dashboard/
│   │   │   └── page.tsx (MODIFY)
│   │   ├── akademik/
│   │   │   └── page.tsx (MODIFY)
│   │   └── ipk/
│   │       └── page.tsx (MODIFY)
│   └── globals.css (MODIFY)
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx (MODIFY)
│   │   └── header.tsx (MODIFY/MINIMIZE)
│   ├── command-bar.tsx (CREATE)
│   ├── drawer.tsx (CREATE)
│   ├── task-drawer.tsx (CREATE)
│   └── dashboard/
│       ├── jadwal-terdekat.tsx (CREATE)
│       ├── statistik-akademik.tsx (CREATE)
│       └── tugas-checkpoint.tsx (CREATE)
├── lib/
│   └── hooks/
│       └── use-command-bar.ts (CREATE)
└── tailwind.config.ts (MODIFY)
```

## 🎨 Color Palette (Tailwind Classes)

```typescript
colors: {
  background: '#F8FAFC', // slate-50
  primary: {
    DEFAULT: '#2563EB', // blue-600
    50: '#EFF6FF',
    100: '#DBEAFE',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  surface: '#FFFFFF',
  border: '#E2E8F0', // slate-200
  text: {
    primary: '#0F172A', // slate-900
    secondary: '#475569', // slate-600
    muted: '#64748B', // slate-500
  }
}
```

## 📝 Typography Scale

```css
.text-xs { font-size: 0.75rem; } /* 12px */
.text-sm { font-size: 0.875rem; } /* 14px */
.text-base { font-size: 1rem; } /* 16px */
.text-lg { font-size: 1.125rem; } /* 18px */
.text-xl { font-size: 1.25rem; } /* 20px */
.text-2xl { font-size: 1.5rem; } /* 24px */
.text-3xl { font-size: 1.875rem; } /* 30px */
.text-4xl { font-size: 2.25rem; } /* 36px */
```

## 🔄 Implementation Order

1. **Phase 1** - Foundation (Layout)
   - Update globals.css and tailwind.config.ts
   - Redesign sidebar with collapse
   - Update main layout
   
2. **Phase 2** - Global Search
   - Create command bar component
   - Add keyboard shortcut
   - Integrate with layout

3. **Phase 3** - Dashboard
   - Create bento box layout
   - Implement 3 main boxes
   - Add dummy data

4. **Phase 4** - Akademik Split-Pane
   - Create master-detail layout
   - Implement left pane (master list)
   - Implement right pane (detail view)

5. **Phase 5** - Tab Components
   - Implement Materi tab (accordion)
   - Implement Tugas tab (cards + progress)
   - Implement Bank Soal tab (list)

6. **Phase 6** - Slide-Over Drawer
   - Create reusable drawer component
   - Implement task drawer
   - Add animations

7. **Phase 7** - Polish & Consistency
   - Apply design system to all pages
   - Update forms and inputs
   - Add empty/loading states

## ✅ Success Criteria

- [ ] Modern SaaS aesthetic achieved
- [ ] Collapsible sidebar works smoothly
- [ ] Floating command bar functional (Ctrl+K)
- [ ] Dashboard bento box layout responsive
- [ ] Akademik split-pane works on desktop
- [ ] Akademik stacks on mobile
- [ ] Slide-over drawer for tasks
- [ ] Consistent typography and spacing
- [ ] No heavy shadows
- [ ] Generous whitespace throughout
- [ ] All pages use new color system

## 🚀 Technical Notes

### Responsive Breakpoints
- Mobile: < 768px (stack layout)
- Tablet: 768px - 1024px (adapted split-pane)
- Desktop: > 1024px (full split-pane)

### Animation Guidelines
- Transitions: 200-300ms
- Easing: ease-in-out
- Sidebar collapse: 300ms
- Drawer slide: 300ms
- Command bar: 200ms

### Accessibility
- Keyboard navigation support
- Focus indicators
- ARIA labels for interactive elements
- Screen reader friendly

### Performance
- Lazy load images
- Virtualize long lists (if needed)
- Optimize animations (transform/opacity only)
- Code split heavy components
