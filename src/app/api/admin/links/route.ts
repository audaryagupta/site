import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { normalizeLinkUrl } from "@/lib/linkTarget";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const links = await prisma.linkItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ links });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const b = await req.json();
  const label = String(b.label || "").trim();
  let url = String(b.url || "").trim();
  if (!label || !url)
    return NextResponse.json(
      { error: "Label and a link, phone number or email are required" },
      { status: 400 }
    );
  url = normalizeLinkUrl(url);
  const count = await prisma.linkItem.count();
  const link = await prisma.linkItem.create({
    data: {
      label: label.slice(0, 80),
      url: url.slice(0, 500),
      icon: String(b.icon || "link").slice(0, 500),
      active: b.active !== false,
      order: typeof b.order === "number" ? b.order : count,
    },
  });
  return NextResponse.json({ link });
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (b.label !== undefined) data.label = String(b.label).slice(0, 80);
  if (b.url !== undefined) {
    data.url = normalizeLinkUrl(String(b.url)).slice(0, 500);
  }
  if (b.icon !== undefined) data.icon = String(b.icon).slice(0, 500);
  if (b.active !== undefined) data.active = Boolean(b.active);
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  const link = await prisma.linkItem.update({ where: { id: b.id }, data });
  return NextResponse.json({ link });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.linkItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
