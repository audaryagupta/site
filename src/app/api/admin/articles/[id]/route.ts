import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { makeSlug, estimateReadingMinutes, excerptFromHtml } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;

  const body = await req.json();
  const current = await prisma.article.findUnique({
    where: { id: params.id },
  });
  if (!current)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentHtml =
    body.contentHtml !== undefined
      ? sanitizeHtml(body.contentHtml)
      : current.contentHtml;
  const status =
    body.status !== undefined
      ? body.status === "published"
        ? "published"
        : "draft"
      : current.status;

  let slug = current.slug;
  if (body.slug && makeSlug(body.slug) !== current.slug) {
    slug = makeSlug(body.slug);
    const clash = await prisma.article.findUnique({ where: { slug } });
    if (clash && clash.id !== current.id) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const data: Record<string, unknown> = {
    slug,
    title: body.title ?? current.title,
    contentHtml,
    excerpt: (body.excerpt ?? excerptFromHtml(contentHtml)).slice(0, 300),
    coverImage: body.coverImage ?? current.coverImage,
    coverCredit: body.coverCredit ?? current.coverCredit,
    language: body.language ?? current.language,
    translationHtml:
      body.translationHtml !== undefined
        ? body.translationHtml
          ? sanitizeHtml(body.translationHtml)
          : null
        : current.translationHtml,
    translationLang:
      body.translationLang !== undefined
        ? body.translationLang
        : current.translationLang,
    status,
    featured:
      body.featured !== undefined ? Boolean(body.featured) : current.featured,
    seoTitle: body.seoTitle ?? current.seoTitle,
    seoDescription: body.seoDescription ?? current.seoDescription,
    readingMinutes: estimateReadingMinutes(contentHtml),
    publishedAt:
      status === "published"
        ? current.publishedAt || new Date()
        : current.publishedAt,
  };

  if (body.tags) {
    const clean = Array.from(
      new Set((body.tags as string[]).map((n) => n.trim()).filter(Boolean))
    );
    data.tags = {
      set: [],
      connectOrCreate: clean.map((name) => ({
        where: { slug: makeSlug(name) },
        create: { name, slug: makeSlug(name) },
      })),
    };
  }

  const article = await prisma.article.update({
    where: { id: params.id },
    data,
    include: { tags: true },
  });

  return NextResponse.json({ article });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;
  await prisma.article.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
