# Project Handoff — KPI Monitor (PT Chief Level Indonesia)

## Status: Deploy ke Hostinger — Debugging MySQL Connection

---

## Apa yang sudah dikerjakan (session ini)

### 1. Rebranding
- Semua referensi "PT Sentra Visi Teknologi" → "PT Chief Level Indonesia"
- Semua email placeholder @sentravisi.com → @chieflevel.co.id
- Logo Etam Daya ditambahkan (sidebar, mobile nav, login page)
- Nama produk: "KPI Monitor" (bukan "SVT KPI Monitor")

### 2. Fitur Activity Calendar
- Route: `/dashboard/calendar`
- Menampilkan KPI tasks sebagai rentang (start_date → due_date) di grid minggu/bulan
- Filter: by Project (KPI), Person (assignee), Department
- Status otomatis: Upcoming (biru), In Progress (amber), Overdue (merah)
- Lokalisasi id/en

### 3. KPI Scheduling
- Kolom baru di `kpis`: `start_date`, `due_date`, `assigned_to`
- Form Create/Edit KPI punya field Start Date, Deadline, Assignee
- Tabel KPI menampilkan kolom Schedule

### 4. Analytics Upgrade
- Filter per bulan spesifik (Jan–Des) + tahun
- Filter range tanggal kustom (dari–sampai)
- Download PDF/Excel sesuai periode yang dipilih

### 5. Settings Functional
- Theme (Light/Dark/System) — fungsional, tersimpan localStorage
- Language (English/Bahasa Indonesia) — fungsional via I18nProvider

### 6. Entry Form — Field Baru
- Output/Outcome — textarea hasil aktivitas
- Issue/Kendala — textarea masalah
- Priority — dropdown (low/medium/high/critical)
- Migrasi SQL: `supabase/add_entry_fields.sql`

### 7. Bug Fixes
- Sidebar highlight: Dashboard tidak lagi highlight saat di halaman lain
- Build error: TypeScript target ES2017 untuk Map iteration
- Analytics crash: useMemo sebelum early return (Rules of Hooks)

### 8. FULL MIGRATION: Supabase → MySQL (Hostinger)
- **Backend rewrite selesai** — semua Supabase SDK calls diganti
- Baru: `src/lib/db/index.ts` — MySQL connection pool (mysql2)
- Baru: `src/lib/db/auth.ts` — Custom JWT + bcrypt auth
- Baru: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Baru: `/api/data/query` — generic SELECT handler
- Baru: `/api/data/mutate` — generic INSERT/UPDATE/DELETE handler
- Baru: `src/lib/supabase/client.ts` — **Compatibility layer** yang meniru Supabase SDK tapi fetch ke API kita (semua halaman frontend tetap jalan tanpa perubahan)
- Middleware: JWT cookie-based (bukan Supabase session)
- Build passes clean ✅

### 9. MySQL Schema & Data
- `supabase/mysql_schema.sql` — Full schema dalam format MySQL
- `supabase/mysql_data.sql` — Data dump (6 depts, 28 KPIs, 8 entries)
- Kolom `password_hash` ditambahkan ke profiles

---

## Status Deploy Hostinger

### Yang sudah dilakukan:
- App deployed dari GitHub ke Hostinger Node.js hosting
- Database MySQL dibuat: `u898032966_kpimonitor`
- User: `u898032966_cevelhub`
- Schema + data imported via phpMyAdmin
- Admin user created: `admin@ppmmonitor.com` / `Admin123!`
- Domain: `ppmmonitor.com`

### Yang MASIH ERROR — perlu debug:
**"Internal server error" saat login** — app jalan (login page muncul) tapi koneksi MySQL gagal.

Terakhir ditambahkan debug logging di `/api/auth/login` (commit `1afbe53`) agar error detail tampil di UI. **Belum sempat test** karena pindah laptop.

### Langkah selanjutnya:
1. Redeploy di Hostinger (auto setelah push terakhir)
2. Coba login → lihat error message detail yang muncul
3. Kemungkinan fix:
   - Jika "Access denied" → password MySQL salah (harus sama di hPanel DB & env var)
   - Jika "ECONNREFUSED" → `MYSQL_HOST` salah
   - Jika "ETIMEDOUT" → Hostinger block koneksi dari Node app ke MySQL
4. Password terakhir yang di-set: `BontangKpi2026` (tanpa special char)
5. Host MySQL: `auth-db1865.hstgr.io`

### Environment Variables yang harus ada di Hostinger:
```
MYSQL_HOST=auth-db1865.hstgr.io
MYSQL_PORT=3306
MYSQL_USER=u898032966_cevelhub
MYSQL_PASSWORD=BontangKpi2026
MYSQL_DATABASE=u898032966_kpimonitor
JWT_SECRET=clf-kpi-2026-xR9mP2qL-secretkey-hostinger
NEXT_PUBLIC_APP_URL=https://ppmmonitor.com
PORT=3000
```

---

## Struktur Project

```
svt-kpi-monitor/
├── src/
│   ├── app/
│   │   ├── api/auth/        ← Login/logout/me (JWT+bcrypt)
│   │   ├── api/data/        ← Query/mutate MySQL (generic handlers)
│   │   ├── (dashboard)/     ← All dashboard pages
│   │   ├── login/           ← Login page (custom, not Supabase)
│   │   └── layout.tsx       ← Root layout (ThemeProvider + I18nProvider)
│   ├── components/          ← UI components
│   ├── lib/
│   │   ├── db/index.ts      ← MySQL connection pool
│   │   ├── db/auth.ts       ← JWT+bcrypt auth logic
│   │   ├── supabase/client.ts ← COMPATIBILITY LAYER (mimics Supabase SDK → calls /api/data/*)
│   │   ├── auth-context.tsx  ← Client-side auth (calls /api/auth/me)
│   │   ├── i18n.tsx          ← id/en localization
│   │   └── theme-context.tsx ← Light/dark theme
│   └── middleware.ts         ← JWT cookie check → redirect to /login
├── supabase/
│   ├── mysql_schema.sql      ← MySQL table definitions
│   ├── mysql_data.sql        ← MySQL data dump
│   ├── setup_all.sql         ← PostgreSQL/Supabase setup (legacy)
│   └── db_dump.json          ← Raw JSON dump of all data
├── public/
│   ├── logo.png              ← Etam Daya logo
│   └── logo-alt.png          ← Alt logo
├── server.js                 ← Custom HTTP server (for LiteSpeed compat)
├── .env.hostinger            ← Hostinger env template
└── package.json              ← start: "next start -p 3000"
```

---

## Repos & Accounts

- **GitHub:** https://github.com/Cat-tj/svt-kpi-monitor (branch: master)
- **Hostinger:** hPanel → ppmmonitor.com (Business Web Hosting + Node.js deploy)
- **Supabase (legacy, may decommission):** project ref `ftsfxxjyukbelgjtvmdo`
- **Vercel (legacy, may decommission):** svt-kpi-monitor-ten.vercel.app

---

## Pending Features (requested but not yet implemented)

1. Target yang tidak tercapai → otomatis jadi problem statement lanjutan
2. Hak akses approval bertingkat (C-Level day-to-day, IMM untuk KPI target)
3. Full i18n di sidebar/semua halaman (saat ini hanya Calendar + Settings)
4. Fitur tambahan: Templates, Announcements, Comments (tabel belum dibuat di MySQL)
