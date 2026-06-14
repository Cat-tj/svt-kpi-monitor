# AI Integration Blueprint — OpenClaw ↔ KPI Monitor

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     VPS (OpenClaw Agents)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Trend Agent  │  │ Anomaly Agent│  │ Report Generator     │  │
│  │ (daily poll) │  │ (hourly)     │  │ (weekly summary)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │              │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
    ┌─────────────────────────────────────────────────────┐
    │            KPI Monitor (Next.js + Supabase)          │
    │                                                       │
    │  GET /api/v1/kpi-data      ← Agents READ data        │
    │  POST /api/webhooks/openclaw  ← Agents PUSH reports  │
    │  POST /functions/v1/kpi-export ← Edge Function alt   │
    │                                                       │
    │  [Supabase RLS + API Key Auth + HMAC Signatures]     │
    └─────────────────────────────────────────────────────┘
```

## Integration Methods (Choose One or Combine)

### Method 1: Next.js REST API (Recommended for Simplicity)

**Read KPI Data:**
```bash
curl -X GET "https://your-app.vercel.app/api/v1/kpi-data?status=approved&period_start=2026-06-01" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Push AI Report:**
```bash
curl -X POST "https://your-app.vercel.app/api/webhooks/openclaw" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Signature: sha256=COMPUTED_HMAC" \
  -d '{
    "title": "Weekly Performance Summary",
    "report_type": "weekly_summary",
    "agent_id": "openclaw-trend-v1",
    "department_id": null,
    "content": {
      "summary": "Overall achievement improved by 4.2%...",
      "highlights": [...],
      "concerns": [...],
      "recommendations": [...]
    }
  }'
```

### Method 2: Supabase Edge Functions (Recommended for Complex Queries)

Edge Functions run on Deno at the edge, closer to your Supabase database.
Better for aggregation-heavy queries that benefit from reduced latency.

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/kpi-export" \
  -H "Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "period_start": "2026-06-01", "period_end": "2026-06-14" }'
```

### Method 3: Direct Supabase Client (Most Flexible)

For agents that need real-time subscriptions or complex joins:

```python
# Python example for OpenClaw agent
from supabase import create_client

supabase = create_client(
    "https://your-project.supabase.co",
    "YOUR_SERVICE_ROLE_KEY"  # Bypasses RLS
)

# Fetch latest approved entries
data = supabase.table("kpi_entries") \
    .select("*, kpi:kpis(name, target_value, department:departments(name))") \
    .eq("status", "approved") \
    .gte("period_start", "2026-06-01") \
    .execute()
```

## Security Model

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Transport | HTTPS only | Encrypt data in transit |
| Authentication | API Key (Bearer token) | Identify the calling agent |
| Integrity | HMAC-SHA256 signature | Verify webhook payloads aren't tampered |
| Authorization | RLS + Service Role | Agents use service role to bypass user-level policies |
| Rate Limiting | Vercel/Supabase built-in | Prevent abuse |
| Expiration | `expires_at` on api_keys | Rotate keys periodically |

## Agent Communication Flow

1. **Daily at 06:00 WIB**: Trend Agent polls `GET /api/v1/kpi-data` for yesterday's approved entries
2. **Agent processes data**: Runs trend detection, anomaly scoring, forecasting
3. **Agent pushes report**: `POST /api/webhooks/openclaw` with structured JSON payload
4. **Dashboard updates**: AI Insights panel shows new reports in real-time (via Supabase Realtime subscriptions)

## API Key Management

Generate keys from the Admin panel → Settings → API Keys.
Keys are hashed before storage (never stored in plaintext).

```sql
-- Generate a new API key (admin action)
INSERT INTO api_keys (name, key_hash, permissions, created_by, expires_at)
VALUES (
  'OpenClaw Trend Agent',
  encode(sha256(('svt-kpi-salt' || 'your-raw-key')::bytea), 'hex'),
  '["read", "write_reports"]',
  'admin-user-id',
  '2027-01-01T00:00:00Z'
);
```

## Webhook Payload Schema

```typescript
interface OpenClawWebhookPayload {
  title: string;                    // Report title
  report_type: string;              // 'trend_analysis' | 'anomaly_alert' | 'weekly_summary'
  agent_id?: string;                // Identifier for the sending agent
  department_id?: string | null;    // Target department (null = company-wide)
  content: {
    summary: string;                // Human-readable summary
    data_points?: Record<string, number>[];
    highlights?: string[];
    concerns?: string[];
    recommendations?: string[];
    confidence_score?: number;      // 0-1 confidence in the analysis
    [key: string]: unknown;         // Extensible
  };
}
```

## Recommended OpenClaw Agent Schedule

| Agent | Frequency | Action |
|-------|-----------|--------|
| Daily Digest | 06:00 WIB | Summarize yesterday's KPI entries |
| Anomaly Detector | Every 2 hours | Flag entries deviating >2σ from mean |
| Weekly Strategist | Monday 08:00 | Comprehensive week review + recommendations |
| Forecast Agent | 1st of month | Project next month's likely achievements |
