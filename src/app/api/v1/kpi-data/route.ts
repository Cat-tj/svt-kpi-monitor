/**
 * KPI Data API - REST Endpoint for OpenClaw Agents
 * GET /api/v1/kpi-data
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac } from "crypto";

// Force dynamic - never statically render this route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

// Validate API key
async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;

  const supabase = getAdminClient();
  const keyHash = createHmac("sha256", "svt-kpi-salt")
    .update(apiKey)
    .digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return false;
  if (!data.is_active) return false;

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const apiKey = authHeader.replace("Bearer ", "");

    if (!await validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: "Unauthorized. Provide a valid API key." },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("kpi_entries")
      .select(`
        id,
        actual_value,
        period_start,
        period_end,
        status,
        notes,
        created_at,
        kpi:kpis (
          id, name, type, timeframe, target_value, unit, weight,
          department:departments ( id, name )
        ),
        submitter:profiles!submitted_by ( full_name, email )
      `)
      .eq("status", searchParams.get("status") || "approved");

    const departmentId = searchParams.get("department_id");
    if (departmentId) {
      query = query.eq("kpi.department_id", departmentId);
    }

    const periodStart = searchParams.get("period_start");
    if (periodStart) {
      query = query.gte("period_start", periodStart);
    }

    const periodEnd = searchParams.get("period_end");
    if (periodEnd) {
      query = query.lte("period_end", periodEnd);
    }

    const { data, error } = await query
      .order("period_end", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[KPI API] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch KPI data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data,
      metadata: {
        fetched_at: new Date().toISOString(),
        filters: {
          department_id: departmentId,
          period_start: periodStart,
          period_end: periodEnd,
          status: searchParams.get("status") || "approved",
        },
      },
    });
  } catch (err) {
    console.error("[KPI API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
