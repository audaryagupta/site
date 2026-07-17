import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { googleConfigured, listEvents } from "@/lib/google";

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
