import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import {
  connectCalendarFromCode,
  connectGmailFromCode,
  type MailRole,
} from "@/lib/google";

// Google redirects here after the admin grants access. For calendar we store a
// refresh token and bounce to the calendar page; for a Gmail mailbox connection
// (state="gmail:mass" | "gmail:personal") we store that mailbox's token and
// bounce back to the email settings page.
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error");

  const isGmail = state.startsWith("gmail:");
  const role: MailRole = state === "gmail:personal" ? "personal" : "mass";
  const dest = new URL(isGmail ? "/admin/email" : "/admin/calendar", url.origin);
  const flag = isGmail ? "gmail" : "gcal";

  if (oauthError) {
    dest.searchParams.set(flag, "error");
    dest.searchParams.set("detail", oauthError);
    return NextResponse.redirect(dest);
  }
  if (!code) {
    dest.searchParams.set(flag, "error");
    dest.searchParams.set("detail", "no_code");
    return NextResponse.redirect(dest);
  }

  try {
    if (isGmail) {
      const { ok, email } = await connectGmailFromCode(code, role);
      dest.searchParams.set("gmail", ok ? "connected" : "noretoken");
      dest.searchParams.set("role", role);
      if (email) dest.searchParams.set("email", email);
    } else {
      const ok = await connectCalendarFromCode(code);
      dest.searchParams.set("gcal", ok ? "connected" : "noretoken");
    }
  } catch (e) {
    dest.searchParams.set(flag, "error");
    // Google's token errors are safe to show (no secrets) and tell the owner
    // exactly what to fix (e.g. redirect_uri_mismatch, invalid_grant).
    const msg = (e as Error)?.message || "unknown_error";
    dest.searchParams.set("detail", msg.slice(0, 180));
  }
  return NextResponse.redirect(dest);
}
