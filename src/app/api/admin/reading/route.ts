import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const items = await prisma.readingItem.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = await req.json();
  const item = await prisma.readingItem.create({
    data: {
      title: body.title || "Untitled",
      author: body.author || "",
      link: body.link || "",
      note: body.note || "",
      category: ["now", "reading", "watching"].includes(body.category)
        ? body.category
        : "reading",
      order: Number(body.order) || 0,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await req.json();
  await prisma.readingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
