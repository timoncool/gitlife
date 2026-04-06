import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/settings"];

export async function middleware(request: NextRequest) {
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

  // Validate session by calling Better Auth's getSession endpoint
  const baseUrl = request.nextUrl.origin;
  const res = await fetch(`${baseUrl}/api/auth/get-session`, {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });

  if (!res.ok || !(await res.json())?.session) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
