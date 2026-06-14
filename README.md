# SVT KPI Monitor

**Enterprise KPI Monitoring & Performance Analytics Platform**
PT. Sentra Visi Teknologi

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)

---

## Overview

SVT KPI Monitor is a comprehensive Key Performance Indicator tracking system designed for PT. Sentra Visi Teknologi. It provides real-time performance monitoring, role-based access control, and an approval workflow for KPI data submissions across all departments.

### Key Features

- **Executive Dashboard** — Data-dense overview with animated KPI cards, department rankings, performance trends, and recent activity feed
- **KPI Metrics Management** — Create, view, and manage KPIs with customizable types (percentage, currency, numerical), weightings, and timeframes
- **Submission & Approval Workflow** — Staff submit progress → Managers review & approve → Data updates on Executive Dashboard
- **Department Analytics** — Department-level performance comparison with charts and rankings
- **Role-Based Access Control (RBAC)** — Three tiers: Admin (C-Level), Manager (Department), Staff (Individual)
- **Real-time Notifications** — Entry approvals, rejections, deadline reminders, KPI assignments
- **Deep Analytics** — Achievement trends, KPI distribution, department comparison, workflow statistics
- **GSAP Animations** — Smooth entrance animations, progress bar transitions, and counter animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | GSAP 3.12 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
svt-kpi-monitor/
├── docs/
│   └── AI_INTEGRATION_BLUEPRINT.md     # AI agent integration guide
├── supabase/
│   ├── schema.sql                       # Full database schema + RLS policies
│   └── functions/
│       └── kpi-export/index.ts          # Edge Function for data export
├── src/
│   ├── app/
│   │   ├── globals.css                  # Tailwind base styles
│   │   ├── layout.tsx                   # Root layout (Inter font)
│   │   ├── page.tsx                     # Redirect → /dashboard
│   │   ├── not-found.tsx                # Custom 404 page
│   │   ├── login/page.tsx               # Authentication page
│   │   ├── auth/callback/route.ts       # OAuth callback
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx               # Dashboard shell (sidebar + header)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx             # Executive Dashboard
│   │   │       ├── kpis/page.tsx        # KPI Metrics table
│   │   │       ├── kpis/[id]/page.tsx   # KPI Detail (ring + trend + history)
│   │   │       ├── entries/page.tsx     # Submissions list
│   │   │       ├── entries/new/page.tsx # New entry form
│   │   │       ├── departments/page.tsx # Department cards
│   │   │       ├── team/page.tsx        # Team management
│   │   │       ├── analytics/page.tsx   # Deep analytics charts
│   │   │       ├── notifications/page.tsx # Notification center
│   │   │       ├── profile/page.tsx     # User profile
│   │   │       └── settings/page.tsx    # System settings
│   │   └── api/
│   │       ├── v1/kpi-data/route.ts     # REST API (GET)
│   │       └── webhooks/openclaw/route.ts # Webhook receiver (POST)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx              # Navigation sidebar
│   │   │   └── header.tsx               # Top header + user dropdown
│   │   └── dashboard/
│   │       ├── executive-dashboard.tsx  # Dashboard orchestrator + GSAP
│   │       ├── kpi-summary-cards.tsx    # Animated summary cards
│   │       ├── department-ranking.tsx   # Department leaderboard
│   │       ├── performance-trend.tsx    # Area chart
│   │       ├── pending-approvals.tsx    # Approval queue
│   │       └── ai-insights.tsx          # Recent activity feed
│   ├── lib/
│   │   ├── database.types.ts            # TypeScript DB types
│   │   ├── utils.ts                     # Utilities (cn, formatters)
│   │   └── supabase/
│   │       ├── client.ts                # Browser client
│   │       ├── server.ts                # Server client + Admin
│   │       └── middleware.ts            # Session refresh
│   └── middleware.ts                    # Route protection
├── .env.local.example                   # Environment template
├── tailwind.config.ts                   # Tailwind theme config
└── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project ([create one free](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Cat-tj/svt-kpi-monitor.git
cd svt-kpi-monitor

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and service role key
```

### Database Setup

1. Go to your Supabase Dashboard → **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run** to create all tables, indexes, RLS policies, and triggers

### Create First User

1. Go to Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Create a user (e.g., `admin@sentravisi.com` / `Admin123!`)
3. Run in SQL Editor to give admin role:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@sentravisi.com';
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

---

## RBAC Roles

| Role | Access Level | Can Do |
|------|-------------|--------|
| **Admin** | Company-wide | View all data, manage all KPIs, approve any entry, manage users |
| **Manager** | Department | View & approve department entries, manage department KPIs |
| **Staff** | Individual | Submit own KPI entries, view own data |

---

## Pages & Features

| Route | Description |
|-------|-------------|
| `/dashboard` | Executive overview: summary cards, trend chart, department ranking, pending approvals, recent activity |
| `/dashboard/kpis` | KPI metrics table with search, filter by department, achievement bars |
| `/dashboard/kpis/[id]` | KPI detail: progress ring, bar chart trend, historical entries |
| `/dashboard/entries` | All submissions with status tabs (pending/approved/rejected) |
| `/dashboard/entries/new` | Submit new KPI entry form |
| `/dashboard/departments` | Department cards with scores, staff count, KPI count |
| `/dashboard/team` | User management table with role badges |
| `/dashboard/analytics` | Achievement trend, KPI distribution pie, department comparison bars, workflow stacked bars |
| `/dashboard/notifications` | Notification feed with type filters and read/unread toggle |
| `/dashboard/profile` | User info, change password, activity log |
| `/dashboard/settings` | Notifications, security, data management, appearance |

---

## Database Schema

The system uses 7 core tables with Row-Level Security:

- **departments** — Organizational units
- **profiles** — User profiles (extends Supabase Auth)
- **kpis** — KPI definitions with type, target, weight, timeframe
- **sub_kpis** — Sub-metrics breakdown
- **kpi_entries** — Staff submissions with approval workflow
- **ai_reports** — Automated analysis reports (for future AI integration)
- **api_keys** — External agent access management

All tables have RLS enabled with role-based policies enforcing Admin > Manager > Staff access hierarchy.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub (already done)
2. Import in [Vercel](https://vercel.com/new)
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, bypasses RLS) |
| `OPENCLAW_API_SECRET` | HMAC secret for webhook validation |

---

## API Endpoints

### GET `/api/v1/kpi-data`
Fetch approved KPI entries. Requires Bearer token authentication.

**Query Parameters:**
- `status` — Filter by status (default: `approved`)
- `department_id` — Filter by department
- `period_start` — ISO date (lower bound)
- `period_end` — ISO date (upper bound)

### POST `/api/webhooks/openclaw`
Receive external reports. Requires `X-OpenClaw-Signature` HMAC header.

---

## License

Proprietary — PT. Sentra Visi Teknologi © 2026
