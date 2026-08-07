import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const entries = await prisma.emailBlacklist.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { email, reason } = (await req.json()) as {
    email?: string;
    reason?: string;
  };
  const e = (email || "").toLowerCase().trim();
  if (!e || !e.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  const entry = await prisma.emailBlacklist.upsert({
    where: { email: e },
    update: { reason: reason || "" },
    create: { email: e, reason: reason || "" },
  });
  // Also mark any existing subscriber as unsubscribed so they stop receiving mail.
  await prisma.subscriber
    .updateMany({ where: { email: e }, data: { status: "unsubscribed" } })
    .catch(() => {});
  await logActivity("email.blacklisted", e);
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const entry = await prisma.emailBlacklist.delete({ where: { id } });
  await logActivity("email.unblacklisted", entry.email);
  return NextResponse.json({ ok: true });
}
