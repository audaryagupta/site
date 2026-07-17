import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleEditor, type ArticleDraft } from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });
  if (!article) notFound();

  const initial: ArticleDraft = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    contentHtml: article.contentHtml,
    excerpt: article.excerpt,
    coverImage: article.coverImage || "",
    coverCredit: article.coverCredit || "",
    language: article.language,
    translationHtml: article.translationHtml || "",
    translationLang: article.translationLang || "hi",
    tags: article.tags.map((t) => t.name),
    status: article.status,
    featured: article.featured,
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Edit writing</h1>
      <ArticleEditor initial={initial} />
    </div>
  );
}
