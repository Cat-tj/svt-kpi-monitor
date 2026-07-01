import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/db/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const result = await signIn(email, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Set JWT as httpOnly cookie
    const response = NextResponse.json({ user: result.user }, { status: 200 });
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[Auth Login]", err);
    return NextResponse.json({ error: err.message || "Internal server error", code: err.code || null }, { status: 500 });
  }
}
