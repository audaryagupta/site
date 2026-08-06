import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z
  .object({
    status: z.enum(["available", "unavailable"]).default("available"),
    kind: z.enum(["online", "offline"]).default("online"),
    city: z.string().trim().max(120).optional().default(""),
    // One or more weekdays (0=Sun … 6=Sat). `days` lets the admin duplicate a
    // weekly window across several weekdays in a single request. Empty for a
    // date-range special window.
    days: z.array(z.number().int().min(0).max(6)).max(7).optional().default([]),
    // When set, this is a special date-range window that overrides the weekly
    // default for every date in [startDate, endDate]. Empty = weekly default.
    startDate: z.string().regex(DATE).optional().default(""),
    endDate: z.string().regex(DATE).optional().default(""),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().trim().max(60).optional().default("Asia/Kolkata"),
    note: z.string().trim().max(300).optional().default(""),
  })
  .refine((d) => (d.startDate ? true : d.days.length > 0), {
    message: "Pick at least one weekday, or a date range.",
  })
  .refine((d) => (!d.endDate ? true : !d.startDate || d.endDate >= d.startDate), {
    message: "End date must be on or after the start date.",
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
  const { days, ...rest } = data;

  // Date-range special window: a single row that overrides the weekly default
  // for every date in [startDate, endDate].
  if (rest.startDate) {
    await prisma.availability.create({
      data: { ...rest, endDate: rest.endDate || rest.startDate, dayOfWeek: 1 },
    });
    return NextResponse.json({ created: 1 });
  }

  // Weekly default: one row per selected weekday.
  const uniqueDays = Array.from(new Set(days));
  await prisma.availability.createMany({
    data: uniqueDays.map((dayOfWeek) => ({
      ...rest,
      dayOfWeek,
      startDate: "",
      endDate: "",
    })),
  });
  return NextResponse.json({ created: uniqueDays.length });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.availability.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
