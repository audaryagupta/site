import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await prisma.article.update({
      where: { slug: params.slug },
      data: { views: { increment: 1 } },
    });
  } catch {
    // article may not exist; ignore
  }
  return NextResponse.json({ ok: true });
}
