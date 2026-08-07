import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/adminApi";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  googleConfigured,
  listEvents,
  updateCalendarEvent,
} from "@/lib/google";

// Events for the console calendar view. Accepts ?start & ?end ISO timestamps
// (defaults to the current month) and returns events across the busy calendars.
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;

  if (!(await googleConfigured())) {
    return NextResponse.json({ connected: false, events: [] });
  }

  const url = new URL(req.url);
  const now = new Date();
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  const start = startParam
    ? new Date(startParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam
    ? new Date(endParam)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  try {
    const events = await listEvents(start, end);
    return NextResponse.json({ connected: true, events });
  } catch (e) {
    return NextResponse.json({
      connected: true,
      events: [],
      error: (e as Error).message,
    });
  }
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(4000).optional().default(""),
  location: z.string().trim().max(300).optional().default(""),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const patchSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  location: z.string().trim().max(300).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  if (!(await googleConfigured()))
    return NextResponse.json({ error: "Calendar not connected." }, { status: 400 });
  let data;
  try {
    data = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  try {
    const { eventId } = await createCalendarEvent({
      summary: data.title,
      description: data.description,
      location: data.location,
      start: new Date(data.start),
      end: new Date(data.end),
    });
    return NextResponse.json({ ok: true, id: eventId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  if (!(await googleConfigured()))
    return NextResponse.json({ error: "Calendar not connected." }, { status: 400 });
  let data;
  try {
    data = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  try {
    await updateCalendarEvent(data.id, {
      summary: data.title,
      description: data.description,
      location: data.location,
      start: data.start ? new Date(data.start) : undefined,
      end: data.end ? new Date(data.end) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteCalendarEvent(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
