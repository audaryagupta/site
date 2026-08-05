import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { connectCalendarFromCode } from "@/lib/google";

// Google redirects here after the admin grants calendar access. We exchange the
// code for a refresh token, store it, then bounce back to the calendar settings.
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const dest = new URL("/admin/calendar", url.origin);

  // Google can bounce back with an explicit error (e.g. access_denied,
  // admin_policy_enforced) instead of a code — surface it so it's actionable.
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    dest.searchParams.set("gcal", "error");
    dest.searchParams.set("detail", oauthError);
    return NextResponse.redirect(dest);
  }

  if (!code) {
    dest.searchParams.set("gcal", "error");
    dest.searchParams.set("detail", "no_code");
    return NextResponse.redirect(dest);
  }

  try {
    const ok = await connectCalendarFromCode(code);
    dest.searchParams.set("gcal", ok ? "connected" : "noretoken");
  } catch (e) {
    dest.searchParams.set("gcal", "error");
    // Google's token errors are safe to show (no secrets) and tell the owner
    // exactly what to fix (e.g. redirect_uri_mismatch, invalid_grant).
    const msg = (e as Error)?.message || "unknown_error";
    dest.searchParams.set("detail", msg.slice(0, 180));
  }
  return NextResponse.redirect(dest);
}
