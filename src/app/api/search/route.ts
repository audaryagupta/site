import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  // SQLite `contains` is case-insensitive for ASCII by default.
  const articles = await prisma.article.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { contentHtml: { contains: q } },
        { tags: { some: { name: { contains: q } } } },
      ],
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
    take: 8,
  });

  return NextResponse.json({
    results: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      tags: a.tags.map((t) => t.name),
    })),
  });
}
