/**
 * Admin API: Deactivate or delete a user
 * POST /api/admin/delete-user  { userId, hardDelete?: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c: any[]) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
        },
      }
    );

    const { data: { user: currentUser } } = await supabaseUser.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, hardDelete } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    if (hardDelete) {
      // Hard delete: remove auth user (cascade deletes profile)
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      // Soft delete: just deactivate the profile
      const { error } = await adminClient
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Log activity
    await adminClient.from("activity_log").insert({
      user_id: currentUser.id,
      action: hardDelete ? "deleted_user" : "deactivated_user",
      target_type: "profile",
      target_id: userId,
      metadata: { hardDelete: !!hardDelete },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[Delete User] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
