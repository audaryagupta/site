import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { hasOpenAI } from "@/lib/openai";
import { createRecapDraft } from "@/lib/recap";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const newsletters = await prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ newsletters });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = await req.json();
  const action = body.action as string;

  if (action === "generate_recap") {
    if (!hasOpenAI()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured yet." },
        { status: 400 }
      );
    }
    const { newsletter, grounded } = await createRecapDraft();
    return NextResponse.json({ newsletter, grounded });
  }

  // Generic / promo / birthday draft
  const nl = await prisma.newsletter.create({
    data: {
      type: body.type || "general",
      subject: body.subject || "",
      previewText: body.previewText || "",
      contentHtml: body.contentHtml || "",
      status: "draft",
      audience: body.audience === "contacts" ? "contacts" : "subscribers",
    },
  });
  return NextResponse.json({ newsletter: nl });
}
