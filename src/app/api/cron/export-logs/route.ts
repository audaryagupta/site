import { NextResponse } from "next/server";
import { exportMonthLogs } from "@/lib/logExport";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return (
    header === `Bearer ${secret}` || url.searchParams.get("secret") === secret
  );
}

// Runs on the 1st of each month and exports the PREVIOUS month's logs to Drive.
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
  const nowIst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  let year = nowIst.getFullYear();
  let month = nowIst.getMonth() - 1; // previous month
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  try {
    const result = await exportMonthLogs(year, month);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
