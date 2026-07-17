import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { renderRecapEmail, type RecapData } from "@/lib/newsletter";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;
  const nl = await prisma.newsletter.findUnique({ where: { id: params.id } });
  if (!nl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ newsletter: nl });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;
  const body = await req.json();
  const current = await prisma.newsletter.findUnique({
    where: { id: params.id },
  });
  if (!current)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.previewText !== undefined) data.previewText = body.previewText;
  if (body.audience !== undefined)
    data.audience = body.audience === "contacts" ? "contacts" : "subscribers";
  if (body.status !== undefined) data.status = body.status;

  // Editing structured recap data → rebuild the preview HTML
  if (body.dataJson !== undefined) {
    data.dataJson = body.dataJson;
    try {
      const parsed = JSON.parse(body.dataJson) as RecapData;
      data.contentHtml = renderRecapEmail({
        subject: body.subject ?? current.subject,
        data: parsed,
        unsubUrl: "#",
      });
      data.previewText = parsed.intro?.slice(0, 140) ?? current.previewText;
    } catch {
      // keep existing html if JSON invalid
    }
  } else if (body.contentHtml !== undefined) {
    data.contentHtml = sanitizeHtml(body.contentHtml);
  }

  const nl = await prisma.newsletter.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ newsletter: nl });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;
  await prisma.newsletter.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
