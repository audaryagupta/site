import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import {
  calendarRedirectUri,
  disconnectCalendar,
  googleConfigured,
} from "@/lib/google";

// Connection status for the console (whether a calendar is linked) plus the
// exact redirect URI the admin must register in Google Cloud.
export async function GET() {
  const g = await guard();
  if (g) return g;
  return NextResponse.json({
    connected: await googleConfigured(),
    redirectUri: calendarRedirectUri(),
    hasCredentials: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  });
}

export async function DELETE() {
  const g = await guard();
  if (g) return g;
  await disconnectCalendar();
  return NextResponse.json({ ok: true });
}
