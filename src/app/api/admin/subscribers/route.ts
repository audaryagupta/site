import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscribers });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Manually add subscribers (e.g. merging an old blog list). Accepts a block of
// lines like "email" or "email, First Name". When notify is true, each new
// person's first 4 newsletters carry a "Audarya added you" note.
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = (await req.json().catch(() => null)) as
    | { text?: string; notify?: boolean }
    | null;
  const notify = Boolean(body?.notify);
  const lines = String(body?.text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let added = 0;
  let skipped = 0;
  const invalid: string[] = [];

  for (const line of lines) {
    // Split "email, First Name" (comma or tab separated).
    const [rawEmail, ...nameParts] = line.split(/[,\t]/);
    const email = (rawEmail || "").trim().toLowerCase();
    const firstName = nameParts.join(" ").trim();
    if (!EMAIL_RE.test(email)) {
      invalid.push(line);
      continue;
    }
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.subscriber.create({
      data: {
        email,
        firstName,
        source: "owner",
        status: "active",
        addedByOwner: true,
        welcomeRemaining: notify ? 4 : 0,
      },
    });
    added += 1;
  }

  if (added > 0) {
    await logActivity(
      "subscribers.added",
      `${added} subscriber(s) added manually${notify ? " (with welcome note)" : ""}`
    );
  }

  return NextResponse.json({ ok: true, added, skipped, invalid });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await req.json();
  await prisma.subscriber.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
