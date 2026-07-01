import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromToken } from "@/lib/db/auth";

// Allowed tables (whitelist to prevent SQL injection)
const ALLOWED_TABLES = [
  "departments", "profiles", "kpis", "sub_kpis", "kpi_entries",
  "ai_reports", "api_keys", "announcements", "kpi_templates", "activity_log",
  "entry_comments", "attachments",
];

// Simple join mappings for common relations
const JOIN_MAP: Record<string, Record<string, string>> = {
  kpis: {
    "department:departments(id, name)": "LEFT JOIN departments ON kpis.department_id = departments.id",
    "assignee:profiles!assigned_to(id, full_name)": "LEFT JOIN profiles AS assignee ON kpis.assigned_to = assignee.id",
  },
  kpi_entries: {
    "kpi:kpis(id, name, timeframe)": "LEFT JOIN kpis ON kpi_entries.kpi_id = kpis.id",
    "submitter:profiles!submitted_by(full_name)": "LEFT JOIN profiles AS submitter ON kpi_entries.submitted_by = submitter.id",
  },
  profiles: {
    "department:departments(id, name)": "LEFT JOIN departments ON profiles.department_id = departments.id",
  },
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") || "";
  const selectStr = searchParams.get("select") || "*";
  const filtersStr = searchParams.get("filters") || "[]";
  const orderStr = searchParams.get("order") || "";
  const limitStr = searchParams.get("limit") || "";

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Table '${table}' not allowed` }, { status: 400 });
  }

  try {
    // Build SELECT columns
    let selectCols = `${table}.*`;
    let joins = "";

    // Parse joins from select string (e.g. "*, department:departments(id, name)")
    const tableJoins = JOIN_MAP[table] || {};
    for (const [pattern, joinSql] of Object.entries(tableJoins)) {
      if (selectStr.includes(pattern.split("(")[0].split(":")[0])) {
        joins += " " + joinSql;
        // Add aliased columns
        if (pattern.includes("department:departments")) {
          selectCols += ", departments.id as _dept_id, departments.name as _dept_name";
        }
        if (pattern.includes("assignee:profiles")) {
          selectCols += ", assignee.id as _assignee_id, assignee.full_name as _assignee_name";
        }
        if (pattern.includes("submitter:profiles")) {
          selectCols += ", submitter.full_name as _submitter_name";
        }
        if (pattern.includes("kpi:kpis")) {
          selectCols += ", kpis.name as _kpi_name, kpis.timeframe as _kpi_timeframe, kpis.target_value as _kpi_target, kpis.unit as _kpi_unit, kpis.department_id as _kpi_dept_id";
        }
      }
    }

    let sql = `SELECT ${selectCols} FROM ${table}${joins}`;
    const params: any[] = [];

    // Filters
    const filters = JSON.parse(filtersStr) as Array<{ type: string; col: string; val: any }>;
    const conditions: string[] = [];
    for (const f of filters) {
      const col = f.col.includes(".") ? f.col : `${table}.${f.col}`;
      switch (f.type) {
        case "eq": conditions.push(`${col} = ?`); params.push(f.val); break;
        case "neq": conditions.push(`${col} != ?`); params.push(f.val); break;
        case "gte": conditions.push(`${col} >= ?`); params.push(f.val); break;
        case "lte": conditions.push(`${col} <= ?`); params.push(f.val); break;
        case "not_is":
          if (f.val === null) conditions.push(`${col} IS NOT NULL`);
          break;
      }
    }

    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");

    // Order
    if (orderStr) {
      const order = JSON.parse(orderStr) as { col: string; asc: boolean };
      sql += ` ORDER BY ${table}.${order.col} ${order.asc ? "ASC" : "DESC"}`;
    }

    // Limit
    if (limitStr) sql += ` LIMIT ${parseInt(limitStr)}`;

    const rows = await query(sql, params);

    // Transform nested objects for compatibility
    const transformed = rows.map((row: any) => {
      const result: any = { ...row };

      // Nest department
      if (row._dept_id !== undefined) {
        result.department = row._dept_name ? { id: row._dept_id, name: row._dept_name } : null;
        delete result._dept_id;
        delete result._dept_name;
      }

      // Nest assignee
      if (row._assignee_id !== undefined) {
        result.assignee = row._assignee_name ? { id: row._assignee_id, full_name: row._assignee_name } : null;
        delete result._assignee_id;
        delete result._assignee_name;
      }

      // Nest submitter
      if (row._submitter_name !== undefined) {
        result.submitter = { full_name: row._submitter_name };
        delete result._submitter_name;
      }

      // Nest kpi
      if (row._kpi_name !== undefined) {
        result.kpi = {
          id: row.kpi_id,
          name: row._kpi_name,
          timeframe: row._kpi_timeframe,
          target_value: row._kpi_target,
          unit: row._kpi_unit,
          department_id: row._kpi_dept_id,
        };
        delete result._kpi_name;
        delete result._kpi_timeframe;
        delete result._kpi_target;
        delete result._kpi_unit;
        delete result._kpi_dept_id;
      }

      // Convert tinyint booleans
      if (result.is_active !== undefined) result.is_active = !!result.is_active;
      if (result.is_read !== undefined) result.is_read = !!result.is_read;

      return result;
    });

    return NextResponse.json({ data: transformed });
  } catch (err: any) {
    console.error("[Query API]", err);
    return NextResponse.json({ error: err.message || "Query failed" }, { status: 500 });
  }
}
