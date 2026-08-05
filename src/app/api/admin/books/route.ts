import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardOwner } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

const STATUSES = ["want", "reading", "finished"];

export async function GET() {
  const g = await guardOwner();
  if (g) return g;
  const books = await prisma.book.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ books });
}

export async function POST(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const b = await req.json();
  const title = String(b.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const status = STATUSES.includes(b.status) ? b.status : "reading";
  const book = await prisma.book.create({
    data: {
      title: title.slice(0, 200),
      author: String(b.author || "").slice(0, 160),
      status,
      rating: Math.min(5, Math.max(0, Number(b.rating) || 0)),
      notes: String(b.notes || "").slice(0, 2000),
      coverUrl: b.coverUrl ? String(b.coverUrl).slice(0, 500) : null,
      startedAt: status !== "want" ? new Date() : null,
      finishedAt: status === "finished" ? new Date() : null,
    },
  });
  return NextResponse.json({ book });
}

export async function PATCH(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const current = await prisma.book.findUnique({ where: { id: b.id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (b.title !== undefined) data.title = String(b.title).slice(0, 200);
  if (b.author !== undefined) data.author = String(b.author).slice(0, 160);
  if (b.notes !== undefined) data.notes = String(b.notes).slice(0, 2000);
  if (b.rating !== undefined)
    data.rating = Math.min(5, Math.max(0, Number(b.rating) || 0));
  if (b.coverUrl !== undefined)
    data.coverUrl = b.coverUrl ? String(b.coverUrl).slice(0, 500) : null;
  if (b.status !== undefined && STATUSES.includes(b.status)) {
    data.status = b.status;
    if (b.status === "finished" && !current.finishedAt)
      data.finishedAt = new Date();
    if (b.status !== "finished") data.finishedAt = null;
    if (b.status !== "want" && !current.startedAt) data.startedAt = new Date();
  }
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  const book = await prisma.book.update({ where: { id: b.id }, data });
  return NextResponse.json({ book });
}

export async function DELETE(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
