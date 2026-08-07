import { NextResponse } from "next/server";
import { hasOpenAI } from "@/lib/openai";
import { createRecapDraft } from "@/lib/recap";

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
  if (!hasOpenAI()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 400 }
    );
  }

  // Draft is created in "pending_approval" and the owner is emailed a review
  // link — nothing is sent to subscribers automatically.
  const { newsletter } = await createRecapDraft({
    status: "pending_approval",
    notify: true,
  });
  return NextResponse.json({ ok: true, id: newsletter.id });
}
