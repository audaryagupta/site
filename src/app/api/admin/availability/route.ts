import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

const schema = z.object({
  kind: z.enum(["online", "offline"]).default("online"),
  city: z.string().trim().max(120).optional().default(""),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().max(60).optional().default("Asia/Kolkata"),
  note: z.string().trim().max(300).optional().default(""),
});

export async function GET() {
  const g = await guard();
  if (g) return g;
  const windows = await prisma.availability.findMany({
    orderBy: [{ kind: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ windows });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid window." }, { status: 400 });
  }
  const window = await prisma.availability.create({ data });
  return NextResponse.json({ window });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.availability.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
