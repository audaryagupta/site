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

  if (!code) {
    dest.searchParams.set("gcal", "error");
    return NextResponse.redirect(dest);
  }

  try {
    const ok = await connectCalendarFromCode(code);
    dest.searchParams.set("gcal", ok ? "connected" : "noretoken");
  } catch {
    dest.searchParams.set("gcal", "error");
  }
  return NextResponse.redirect(dest);
}
