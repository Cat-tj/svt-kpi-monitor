import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

// GET /api/data/entries — list entries (scoped by role)
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sql = `
    SELECT e.*, 
           k.name as kpi_name, k.target_value, k.unit as kpi_unit, k.timeframe as kpi_timeframe,
           k.department_id, d.name as department_name,
           p.full_name as submitter_name
    FROM kpi_entries e
    JOIN kpis k ON e.kpi_id = k.id
    LEFT JOIN departments d ON k.department_id = d.id
    LEFT JOIN profiles p ON e.submitted_by = p.id
  `;

  let params: any[] = [];

  if (user.role === "staff") {
    sql += " WHERE e.submitted_by = ?";
    params = [user.id];
  } else if (user.role === "manager") {
    sql += " WHERE k.department_id = ?";
    params = [user.department_id];
  }
  // admin sees all

  sql += " ORDER BY e.created_at DESC LIMIT 200";

  const rows = await query(sql, params);

  const entries = rows.map((r: any) => ({
    ...r,
    kpi: {
      id: r.kpi_id,
      name: r.kpi_name,
      target_value: r.target_value,
      unit: r.kpi_unit,
      timeframe: r.kpi_timeframe,
      department: r.department_name ? { name: r.department_name } : null,
    },
    submitter: { full_name: r.submitter_name },
  }));

  return NextResponse.json({ data: entries });
}

// POST /api/data/entries — submit new entry
export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = crypto.randomUUID();

  await execute(
    `INSERT INTO kpi_entries (id, kpi_id, submitted_by, period_start, period_end, actual_value, notes, issue, priority, output)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.kpi_id,
      user.id,
      body.period_start,
      body.period_end,
      body.actual_value,
      body.notes || null,
      body.issue || null,
      body.priority || null,
      body.output || null,
    ]
  );

  return NextResponse.json({ id }, { status: 201 });
}
