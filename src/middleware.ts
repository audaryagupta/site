import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public admin endpoints
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email || "").toString().toLowerCase().trim();
  const authorized = Boolean(email) && email === adminEmail;

  if (!authorized) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
