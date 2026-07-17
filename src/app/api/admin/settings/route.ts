import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";

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

  // Log the launch state change specifically (a major action).
  if ("site_live" in (body.settings || {})) {
    const prev = await prisma.setting.findUnique({ where: { key: "site_live" } });
    const wasLive = prev?.value === "true";
    const nowLive = body.settings.site_live === "true";
    if (wasLive !== nowLive) {
      await logActivity(
        nowLive ? "site.went_live" : "site.reverted_to_teaser",
        nowLive ? "Main domain switched to the full site" : "Main domain reverted to teaser"
      );
    }
  }

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value ?? "" },
      create: { key, value: value ?? "" },
    });
  }
  return NextResponse.json({ ok: true });
}
