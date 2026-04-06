import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/settings"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect specific routes
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — allow through. Full session validation happens in API routes.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
