import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

// GET /api/data/departments
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query("SELECT * FROM departments ORDER BY name");
  return NextResponse.json({ data: rows });
}

// POST /api/data/departments
export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { name, description } = await request.json();
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO departments (id, name, description) VALUES (?, ?, ?)",
    [id, name, description || null]
  );

  return NextResponse.json({ id }, { status: 201 });
}
