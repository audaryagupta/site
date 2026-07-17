import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ArticleBody } from "@/components/ArticleBody";
import { ShareButtons } from "@/components/ShareButtons";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { ArticleCard } from "@/components/ArticleCard";
import { Comments } from "@/components/Comments";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { site } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article || article.status !== "published") return { title: "Not found" };
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticleBySlug(params.slug);
  if (!article || article.status !== "published") notFound();

  const related = await getRelatedArticles(
    article.id,
    article.tags.map((t) => t.id)
  );

  return (
    <article>

      {/* Header */}
      <Container className="max-w-3xl pt-14 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {article.tags.map((t) => (
            <Link
              key={t.id}
              href={`/writings?topic=${t.slug}`}
              className="text-xs font-medium uppercase tracking-widest text-muted hover:text-foreground"
            >
              {t.name}
            </Link>
          ))}
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        <p className="mt-5 text-sm text-muted">
          By {site.author} · {formatDate(article.publishedAt)} ·{" "}
          {article.readingMinutes} min read
        </p>
        <div className="mt-4">
          <ArticleEngagement
            slug={article.slug}
            views={article.views + article.viewsBoost}
            likes={article.likes + article.likesBoost}
          />
        </div>
      </Container>

      {/* Cover */}
      {article.coverImage && (
        <Container className="mt-10 max-w-4xl">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full rounded-sm border border-line object-cover"
            />
            {article.coverCredit && (
              <figcaption className="mt-2 text-center text-xs text-muted">
                {article.coverCredit}
              </figcaption>
            )}
          </figure>
        </Container>
      )}

      {/* Body */}
      <Container className="mt-12 max-w-prose">
        <ArticleBody
          primaryHtml={sanitizeHtml(article.contentHtml)}
          primaryLang={article.language}
          translationHtml={
            article.translationHtml ? sanitizeHtml(article.translationHtml) : null
          }
          translationLang={article.translationLang}
        />

        <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
          <ShareButtons
            title={article.title}
            path={`/writings/${article.slug}`}
          />
          <Link
            href="/writings"
            className="link-underline text-sm text-muted hover:text-foreground"
          >
            ← All writings
          </Link>
        </div>

        <Comments slug={article.slug} />
      </Container>

      {/* Related */}
      {related.length > 0 && (
        <Container className="mt-20">
          <h2 className="mb-8 font-display text-2xl font-semibold">
            Keep reading
          </h2>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}
