/**
 * Admin API: Update an existing user
 * POST /api/admin/update-user
 * Body: { userId, full_name?, role?, department_id?, is_active?, password? }
 * Updates the profile fields and (optionally) the auth password / email.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is authenticated
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

    // Service role client (bypasses RLS)
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    // Verify caller is admin
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, full_name, role, department_id, is_active, password } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Prevent an admin from demoting/deactivating themselves (avoids lock-out)
    if (userId === currentUser.id) {
      if (role && role !== "admin") {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
      }
      if (is_active === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
      }
    }

    if (role && !["admin", "manager", "staff"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password !== undefined && password !== "" && password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Build the profile update payload (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (department_id !== undefined) updates.department_id = department_id || null;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    // Optionally update the auth password
    if (password) {
      const { error: pwError } = await adminClient.auth.admin.updateUserById(userId, { password });
      if (pwError) {
        return NextResponse.json({ error: `Profile updated but password change failed: ${pwError.message}` }, { status: 400 });
      }
    }

    // Log the activity
    await adminClient.from("activity_log").insert({
      user_id: currentUser.id,
      action: "updated_user",
      target_type: "profile",
      target_id: userId,
      metadata: { ...updates, password_changed: !!password },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[Update User] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
