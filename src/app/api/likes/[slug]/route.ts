import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public like. One increment per request; the client prevents repeat likes
// from the same browser via localStorage. Returns the public like count.
export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await prisma.article.update({
      where: { slug: params.slug },
      data: { likes: { increment: 1 } },
      select: { likes: true, likesBoost: true },
    });
    return NextResponse.json({
      ok: true,
      likes: article.likes + article.likesBoost,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
