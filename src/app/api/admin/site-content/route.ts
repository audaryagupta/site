import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";
import { CONTENT_PREFIX } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

// A successful GET doubles as the "am I allowed to edit?" check for the
// floating editor bar (it returns 401 for signed-out visitors).
export async function GET() {
  const g = await guard();
  if (g) return g;
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: CONTENT_PREFIX } },
  });
  const content: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      content[r.key.slice(CONTENT_PREFIX.length)] = JSON.parse(r.value);
    } catch {
      // skip malformed
    }
  }
  return NextResponse.json({ ok: true, content });
}

export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = (await req.json().catch(() => null)) as
    | { edits?: { id: string; value: unknown }[] }
    | null;
  const edits = body?.edits || [];
  if (!Array.isArray(edits) || edits.length === 0) {
    return NextResponse.json({ error: "No edits provided" }, { status: 400 });
  }
  for (const e of edits) {
    if (!e || typeof e.id !== "string" || !e.id) continue;
    const key = CONTENT_PREFIX + e.id.slice(0, 120);
    const value = JSON.stringify(e.value ?? {});
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  await logActivity("site.content_edited", `${edits.length} region(s) updated`);
  return NextResponse.json({ ok: true });
}
