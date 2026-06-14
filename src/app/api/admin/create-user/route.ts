/**
 * Admin API: Create new user
 * POST /api/admin/create-user
 * Creates a user in Supabase Auth + assigns role/department in profiles
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

    // Check role using service client
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { email, password, full_name, role, department_id } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields: email, password, full_name, role" }, { status: 400 });
    }

    // Create user via Admin Auth API
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Update profile with role and department (trigger creates basic profile)
    // Wait a moment for trigger to fire, then update
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        role,
        department_id: department_id || null,
        full_name,
      })
      .eq("id", newUser.user.id);

    // If trigger didn't fire (was dropped), insert profile directly
    if (profileError) {
      await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        full_name,
        email,
        role,
        department_id: department_id || null,
      } as any);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role,
      },
    }, { status: 201 });

  } catch (err: any) {
    console.error("[Create User] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
