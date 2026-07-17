import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { calendarConsentUrl } from "@/lib/google";

// Kicks off the Google Calendar authorization (admin only). Redirects the
// browser to Google's consent screen; Google returns to /api/admin/google/callback.
export async function GET() {
  const g = await guard();
  if (g) return g;
  return NextResponse.redirect(calendarConsentUrl());
}
