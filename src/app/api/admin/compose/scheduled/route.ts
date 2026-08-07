import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Upcoming + recently-processed scheduled emails, for the composer sidebar.
export async function GET() {
  const g = await guard();
  if (g) return g;
  const rows = await prisma.scheduledEmail.findMany({
    orderBy: [{ status: "asc" }, { sendAt: "asc" }],
    take: 50,
  });
  return NextResponse.json({
    scheduled: rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      count: (() => {
        try {
          return (JSON.parse(r.recipients) as string[]).length;
        } catch {
          return 0;
        }
      })(),
      sendAt: r.sendAt.toISOString(),
      status: r.status,
      sentCount: r.sentCount,
    })),
  });
}

// Remove a scheduled/draft/recent email from the list. Deleting a still-pending
// row also stops it from ever being sent (the cron won't find it).
export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.scheduledEmail.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
