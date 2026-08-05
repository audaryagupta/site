import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardOwner } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

// Personal goals are owner-only (not shown to invited secretaries).
export async function GET() {
  const g = await guardOwner();
  if (g) return g;
  const goals = await prisma.goal.findMany({
    orderBy: [{ done: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const b = await req.json();
  const title = String(b.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const goal = await prisma.goal.create({
    data: {
      title: title.slice(0, 200),
      detail: String(b.detail || "").slice(0, 1000),
      horizon: b.horizon === "long" ? "long" : "short",
    },
  });
  return NextResponse.json({ goal });
}

export async function PATCH(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (b.title !== undefined) data.title = String(b.title).slice(0, 200);
  if (b.detail !== undefined) data.detail = String(b.detail).slice(0, 1000);
  if (b.horizon !== undefined) data.horizon = b.horizon === "long" ? "long" : "short";
  if (b.done !== undefined) {
    data.done = Boolean(b.done);
    data.completedAt = b.done ? new Date() : null;
  }
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  const goal = await prisma.goal.update({ where: { id: b.id }, data });
  return NextResponse.json({ goal });
}

export async function DELETE(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
