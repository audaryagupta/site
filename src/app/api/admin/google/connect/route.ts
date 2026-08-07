import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { calendarConsentUrl } from "@/lib/google";

// Kicks off the Google Calendar authorization (admin only). Redirects the
// browser to Google's consent screen; Google returns to /api/admin/google/callback.
// Pass ?extended=1 to also request Drive/Docs (log export / letterhead).
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;
  const extended = new URL(req.url).searchParams.get("extended") === "1";
  return NextResponse.redirect(calendarConsentUrl(extended));
}
