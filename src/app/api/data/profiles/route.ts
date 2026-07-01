import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

// GET /api/data/profiles — list team members
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sql = `
    SELECT p.id, p.full_name, p.email, p.role, p.department_id, p.avatar_url, p.is_active,
           d.name as department_name
    FROM profiles p
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.is_active = 1
    ORDER BY p.full_name
  `;

  const rows = await query(sql);
  const profiles = rows.map((r: any) => ({
    ...r,
    is_active: !!r.is_active,
    department: r.department_name ? { id: r.department_id, name: r.department_name } : null,
  }));

  return NextResponse.json({ data: profiles });
}
