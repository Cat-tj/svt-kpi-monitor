/**
 * OpenClaw Webhook Endpoint
 * Receives AI-generated reports and insights from VPS-hosted OpenClaw agents.
 *
 * Security: Validates requests via HMAC signature in X-OpenClaw-Signature header.
 * This bypasses Supabase RLS by using the service role client.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { createHmac } from "crypto";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Verify the webhook signature from OpenClaw
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.OPENCLAW_API_SECRET;
  if (!secret) return false;

  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `sha256=${expectedSig}` === signature;
}

// POST /api/webhooks/openclaw - Receive AI reports
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get("x-openclaw-signature") || "";
    const body = await request.text();

    // Verify webhook authenticity
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);

    // Validate payload structure
    if (!payload.title || !payload.report_type || !payload.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, report_type, content" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert the AI report
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
