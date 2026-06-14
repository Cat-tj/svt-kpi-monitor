/**
 * Admin API: Create new user
 * POST /api/admin/create-user
 * Creates a user in Supabase Auth + creates profile with role/department
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is authenticated and is admin
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
    const { email, password, full_name, role, department_id } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields: email, password, full_name, role" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Step 1: Create user in Supabase Auth
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Step 2: Wait briefly for trigger to potentially create profile
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 3: Force upsert profile with correct role and department
    // This handles both cases: trigger created it (we update), or trigger failed (we insert)
    const { error: upsertError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: newUser.user.id,
          full_name,
          email,
          role,
          department_id: department_id || null,
          is_active: true,
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("[Create User] Profile upsert failed:", upsertError);
      // User was created in auth but profile failed - try to clean up
      // Don't delete the auth user, just report the error
      return NextResponse.json({
        error: `User auth created but profile setup failed: ${upsertError.message}. Please update the user's profile manually.`,
      }, { status: 500 });
    }

    // Step 4: Log the activity
    await adminClient.from("activity_log").insert({
      user_id: currentUser.id,
      action: "created_user",
      target_type: "profile",
      target_id: newUser.user.id,
      metadata: { full_name, email, role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role,
        department_id: department_id || null,
      },
    }, { status: 201 });

  } catch (err: any) {
    console.error("[Create User] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
