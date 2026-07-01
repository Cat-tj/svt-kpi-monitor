import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

const ALLOWED_TABLES = [
  "departments", "profiles", "kpis", "sub_kpis", "kpi_entries",
  "ai_reports", "announcements", "kpi_templates", "activity_log",
  "entry_comments", "attachments",
];

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, table, data, filters } = body;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Table '${table}' not allowed` }, { status: 400 });
  }

  try {
    if (action === "insert") {
      const insertData = Array.isArray(data) ? data : [data];
      const results: any[] = [];

      for (const row of insertData) {
        const id = row.id || crypto.randomUUID();
        const rowWithId = { ...row, id };
        const columns = Object.keys(rowWithId);
        const values = Object.values(rowWithId);
        const placeholders = columns.map(() => "?").join(", ");

        await execute(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
          values
        );
        results.push(rowWithId);
      }

      return NextResponse.json({ data: results.length === 1 ? results[0] : results });
    }

    if (action === "update") {
      if (!filters || filters.length === 0) {
        return NextResponse.json({ error: "Update requires filters" }, { status: 400 });
      }

      const setCols = Object.keys(data).map((k) => `${k} = ?`).join(", ");
      const setVals = Object.values(data);

      let where = "";
      const whereVals: any[] = [];
      for (const f of filters) {
        if (f.type === "eq") {
          where += (where ? " AND " : " WHERE ") + `${f.col} = ?`;
          whereVals.push(f.val);
        }
      }

      await execute(`UPDATE ${table} SET ${setCols}${where}`, [...setVals, ...whereVals]);
      return NextResponse.json({ data: null, success: true });
    }

    if (action === "delete") {
      if (!filters || filters.length === 0) {
        return NextResponse.json({ error: "Delete requires filters" }, { status: 400 });
      }

      let where = "";
      const whereVals: any[] = [];
      for (const f of filters) {
        if (f.type === "eq") {
          where += (where ? " AND " : " WHERE ") + `${f.col} = ?`;
          whereVals.push(f.val);
        }
      }

      await execute(`DELETE FROM ${table}${where}`, whereVals);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Mutate API]", err);
    // Friendly duplicate error
    if (err.message?.includes("Duplicate") || err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Duplicate entry — a record with these values already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}
