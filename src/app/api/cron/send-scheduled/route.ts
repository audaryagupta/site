import { NextResponse } from "next/server";
import { runDueScheduledEmails } from "@/lib/scheduledEmail";
import { runDueRecap } from "@/lib/recap";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { processed } = await runDueScheduledEmails();
  // Also fire the auto-scheduled Weekly Recap if it's due (own error boundary
  // so a recap failure never blocks scheduled-email delivery).
  let recap: { ran: boolean; reason?: string } = { ran: false, reason: "skipped" };
  try {
    recap = await runDueRecap();
  } catch (e) {
    recap = { ran: false, reason: (e as Error).message.slice(0, 120) };
  }
  return NextResponse.json({ ok: true, processed, recap });
}
