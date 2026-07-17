import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { makeSlug, estimateReadingMinutes, excerptFromHtml } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const articles = await prisma.article.findMany({
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ articles });
}

async function connectTags(names: string[]) {
  const clean = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean))
  );
  return clean.map((name) => {
    const slug = makeSlug(name);
    return {
      where: { slug },
      create: { name, slug },
    };
  });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const body = await req.json();
  const title: string = (body.title || "Untitled").trim();
  const contentHtml: string = sanitizeHtml(body.contentHtml || "");
  const translationHtml = body.translationHtml
    ? sanitizeHtml(body.translationHtml)
    : null;
  const status: string = body.status === "published" ? "published" : "draft";

  let slug = body.slug ? makeSlug(body.slug) : makeSlug(title);
  if (!slug) slug = `post-${Date.now()}`;
  // ensure unique
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const tags = await connectTags(body.tags || []);

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      contentHtml,
      excerpt: (body.excerpt || excerptFromHtml(contentHtml)).slice(0, 300),
      coverImage: body.coverImage || null,
      coverCredit: body.coverCredit || null,
      language: body.language || "en",
      translationHtml,
      translationLang: body.translationLang || null,
      status,
      featured: Boolean(body.featured),
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      readingMinutes: estimateReadingMinutes(contentHtml),
      publishedAt: status === "published" ? new Date() : null,
      tags: { connectOrCreate: tags },
    },
    include: { tags: true },
  });

  return NextResponse.json({ article });
}
