import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
// When set (e.g. "studio.byaudarya.com"), the admin console lives on this
// subdomain and is hidden from the public site host. If unset, the console is
// served under /admin on the same host (useful for local development).
const studioHost = (process.env.NEXT_PUBLIC_STUDIO_HOST || "")
  .toLowerCase()
  .trim();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const onStudio = Boolean(studioHost) && host === studioHost;

  // NextAuth routes always pass through.
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Keep the console off the public host when a studio subdomain is configured.
  if (
    studioHost &&
    !onStudio &&
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Resolve which console path (if any) this request maps to.
  let consolePath: string | null = null;
  let rewrite = false;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    consolePath = pathname;
  } else if (onStudio && !pathname.startsWith("/api")) {
    // On the studio subdomain, serve the console from the root.
    consolePath = pathname === "/" ? "/admin" : `/admin${pathname}`;
    rewrite = true;
  }

  // Not a console request → public site.
  if (!consolePath) return NextResponse.next();

  const finish = () => {
    if (rewrite) {
      const url = req.nextUrl.clone();
      url.pathname = consolePath as string;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  };

  // Login page is public.
  if (consolePath.startsWith("/admin/login")) return finish();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email || "").toString().toLowerCase().trim();
  const authorized = Boolean(email) && email === adminEmail;

  if (!authorized) {
    if (consolePath.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return finish();
}

export const config = {
  // Run on everything except Next internals and static files (paths with a dot).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
