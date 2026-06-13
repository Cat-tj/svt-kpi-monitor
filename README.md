# SVT KPI Monitor

**Enterprise KPI Monitoring & Performance Analytics Platform**
PT. Sentra Visi Teknologi

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui patterns |
| Animations | GSAP 3.12 |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| AI Integration | REST API + Webhooks for OpenClaw |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Project Structure

```
svt-kpi-monitor/
├── docs/
│   └── AI_INTEGRATION_BLUEPRINT.md    # OpenClaw integration guide
├── supabase/
│   ├── schema.sql                      # Full database schema + RLS
│   └── functions/
│       └── kpi-export/index.ts         # Edge Function for AI agents
├── src/
│   ├── app/
│   │   ├── globals.css                 # Tailwind base styles
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Redirect to /dashboard
│   │   ├── login/page.tsx              # Authentication page
│   │   ├── auth/callback/route.ts      # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Dashboard shell (sidebar + header)
│   │   │   └── dashboard/page.tsx      # Executive dashboard entry
│   │   └── api/
│   │       ├── v1/kpi-data/route.ts    # REST API for AI agents (GET)
│   │       └── webhooks/openclaw/route.ts # Webhook receiver (POST)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx             # Navigation sidebar
│   │   │   └── header.tsx              # Top header bar
│   │   └── dashboard/
│   │       ├── executive-dashboard.tsx # Main dashboard orchestrator + GSAP
│   │       ├── kpi-summary-cards.tsx   # Summary metric cards
│   │       ├── department-ranking.tsx  # Department leaderboard
│   │       ├── performance-trend.tsx   # Line/area chart
│   │       ├── pending-approvals.tsx   # Approval workflow queue
│   │       └── ai-insights.tsx         # AI-generated insights panel
│   ├── lib/
│   │   ├── database.types.ts           # TypeScript DB types
│   │   ├── utils.ts                    # Utility functions (cn, formatters)
│   │   └── supabase/
│   │       ├── client.ts               # Browser Supabase client
│   │       ├── server.ts               # Server Supabase client + Admin
│   │       └── middleware.ts           # Session refresh middleware
│   └── middleware.ts                   # Next.js route protection
├── .env.local.example                  # Environment variables template
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Quick Start

```bash
# 1. Clone and install
cd svt-kpi-monitor
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in your Supabase project URL, anon key, and service role key

# 3. Setup database
# Go to Supabase Dashboard > SQL Editor > paste contents of supabase/schema.sql

# 4. Run development server
npm run dev
```

---

## RBAC Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Admin** | C-Level / Full | View all data, manage KPIs, manage users, API keys, AI reports |
| **Manager** | Department | View & approve department entries, manage department KPIs |
| **Staff** | Individual | Submit KPI entries, view own data and approved reports |

---

## AI Integration (OpenClaw)

See [docs/AI_INTEGRATION_BLUEPRINT.md](./docs/AI_INTEGRATION_BLUEPRINT.md) for full details.

**TL;DR:**
- Agents READ via `GET /api/v1/kpi-data` (Bearer token auth)
- Agents WRITE via `POST /api/webhooks/openclaw` (HMAC-signed)
- All communication over HTTPS with API key rotation support

---

## License

Proprietary — PT. Sentra Visi Teknologi © 2026
