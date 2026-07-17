import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json({ settings: map });
}

export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = (await req.json()) as { settings: Record<string, string> };
  const entries = Object.entries(body.settings || {});
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value ?? "" },
      create: { key, value: value ?? "" },
    });
  }
  return NextResponse.json({ ok: true });
}
