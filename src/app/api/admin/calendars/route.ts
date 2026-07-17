import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { getCalendarConfig, googleConfigured, listCalendars } from "@/lib/google";

export async function GET() {
  const g = await guard();
  if (g) return g;

  const config = await getCalendarConfig();
  if (!googleConfigured()) {
    return NextResponse.json({ configured: false, calendars: [], config });
  }
  try {
    const calendars = await listCalendars();
    return NextResponse.json({ configured: true, calendars, config });
  } catch (e) {
    return NextResponse.json({
      configured: true,
      calendars: [],
      config,
      error: (e as Error).message,
    });
  }
}

export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;

  const body = (await req.json()) as {
    writeId?: string;
    busyIds?: string[];
  };
  const writeId = (body.writeId || "").trim();
  const busyIds = (body.busyIds || [])
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

  for (const [key, value] of [
    ["gcal_write_id", writeId],
    ["gcal_busy_ids", busyIds],
  ] as const) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ ok: true, config: await getCalendarConfig() });
}
