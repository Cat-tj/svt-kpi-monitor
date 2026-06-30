/**
 * OpenClaw Webhook Endpoint
 * Receives AI-generated reports and insights from VPS-hosted OpenClaw agents.
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

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.OPENCLAW_API_SECRET;
  if (!secret) return false;

  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `sha256=${expectedSig}` === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-openclaw-signature") || "";
    const body = await request.text();

    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);

    if (!payload.title || !payload.report_type || !payload.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, report_type, content" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("ai_reports")
      .insert({
        title: payload.title,
        report_type: payload.report_type,
        content: payload.content,
        department_id: payload.department_id || null,
        generated_by: payload.agent_id || "openclaw",
      })
      .select()
      .single();

    if (error) {
      console.error("[OpenClaw Webhook] DB Error:", error);
      return NextResponse.json(
        { error: "Failed to store report" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, report_id: data.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[OpenClaw Webhook] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
