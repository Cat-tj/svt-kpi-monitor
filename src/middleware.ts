import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // If no token and trying to access dashboard, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Token exists — let request through (API route /api/auth/me validates it)
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
