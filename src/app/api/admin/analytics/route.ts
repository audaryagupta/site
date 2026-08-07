import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET() {
  const g = await guard();
  if (g) return g;

  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      readingMinutes: true,
      views: true,
      likes: true,
      viewsBoost: true,
      likesBoost: true,
      publishedAt: true,
    },
  });

  const comments = await prisma.comment.groupBy({
    by: ["articleSlug"],
    _count: { _all: true },
    where: { hidden: false },
  });
  const commentMap = new Map(
    comments.map((c) => [c.articleSlug, c._count._all])
  );

  const rows = articles.map((a) => ({
    ...a,
    comments: commentMap.get(a.slug) || 0,
    publicViews: a.views + a.viewsBoost,
    publicLikes: a.likes + a.likesBoost,
  }));

  const totals = {
    realViews: rows.reduce((s, r) => s + r.views, 0),
    realLikes: rows.reduce((s, r) => s + r.likes, 0),
    publicViews: rows.reduce((s, r) => s + r.publicViews, 0),
    publicLikes: rows.reduce((s, r) => s + r.publicLikes, 0),
    comments: rows.reduce((s, r) => s + r.comments, 0),
  };

  return NextResponse.json({ rows, totals });
}

// Update only the display boosts (never the real counts).
export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id, viewsBoost, likesBoost } = await req.json();
  const data: { viewsBoost?: number; likesBoost?: number } = {};
  if (viewsBoost !== undefined) data.viewsBoost = Math.max(0, Number(viewsBoost) || 0);
  if (likesBoost !== undefined) data.likesBoost = Math.max(0, Number(likesBoost) || 0);
  const article = await prisma.article.update({ where: { id }, data });
  return NextResponse.json({
    ok: true,
    publicViews: article.views + article.viewsBoost,
    publicLikes: article.likes + article.likesBoost,
  });
}
