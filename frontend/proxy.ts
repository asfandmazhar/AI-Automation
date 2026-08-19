import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isAuthPage = pathname === "/auth";
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/ai-system");

  let verifiedRole: string | null = null;
  let isValidToken = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      isValidToken = true;
      verifiedRole = (payload.role as string) || null;
    } catch {
      isValidToken = false;
    }
  }

  const isAdmin = verifiedRole?.toLowerCase() === "admin";

  if (isAuthPage) {
    if (isValidToken && verifiedRole) {
      const url = request.nextUrl.clone();
      url.pathname = isAdmin ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAdminRoute || isDashboardRoute) {
    if (!isValidToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      return response;
    }

    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isDashboardRoute && isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/ai-system/:path*", "/auth"],
};
