import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

// GET /api/data/kpis — list active KPIs
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sql = `
    SELECT k.*, d.name as department_name,
           p.full_name as assignee_name
    FROM kpis k
    LEFT JOIN departments d ON k.department_id = d.id
    LEFT JOIN profiles p ON k.assigned_to = p.id
    WHERE k.is_active = 1
    ORDER BY k.name
  `;

  const rows = await query(sql);

  // Transform to match frontend shape
  const kpis = rows.map((r: any) => ({
    ...r,
    is_active: !!r.is_active,
    department: r.department_name ? { id: r.department_id, name: r.department_name } : null,
    assignee: r.assignee_name ? { id: r.assigned_to, full_name: r.assignee_name } : null,
  }));

  return NextResponse.json({ data: kpis });
}

// POST /api/data/kpis — create new KPI
export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = crypto.randomUUID();

  await execute(
    `INSERT INTO kpis (id, name, description, department_id, type, timeframe, target_value, weight, unit, start_date, due_date, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.name,
      body.description || null,
      body.department_id,
      body.type || "numerical",
      body.timeframe || "monthly",
      body.target_value,
      body.weight || 10,
      body.unit || null,
      body.start_date || null,
      body.due_date || null,
      body.assigned_to || null,
      user.id,
    ]
  );

  return NextResponse.json({ id }, { status: 201 });
}
