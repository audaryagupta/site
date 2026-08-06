import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ArticleCard } from "@/components/ArticleCard";
import { getPublishedArticles, getUsedTopics } from "@/lib/queries";
import { cx } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "My Writings",
  description:
    "Essays on finance, business, technology, geopolitics and more by Audarya Gupta.",
  alternates: { canonical: "/writings" },
};

export default async function WritingsPage({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const topic = searchParams.topic;
  const [articles, topics] = await Promise.all([
    getPublishedArticles({ topic }),
    getUsedTopics(),
  ]);

  const activeTopic = topics.find((t) => t.slug === topic);

  return (
    <Container className="py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-5xl font-semibold tracking-tight">
          My Writings
        </h1>
        <p className="mt-4 font-serif text-lg text-muted">
          Long and short-form thinking on the forces that shape economies,
          technology and the world.
        </p>
      </header>

      {/* Topic filter */}
      <div className="mb-12 flex flex-wrap gap-2 border-y border-line py-5">
        <Link
          href="/writings"
          className={cx(
            "rounded-full border px-4 py-1.5 text-sm transition",
            !topic
              ? "border-foreground bg-foreground text-background"
              : "border-line hover:bg-subtle"
          )}
        >
          All
        </Link>
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/writings?topic=${t.slug}`}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm transition",
              topic === t.slug
                ? "border-foreground bg-foreground text-background"
                : "border-line hover:bg-subtle"
            )}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {activeTopic && (
        <p className="mb-6 text-sm text-muted">
          Showing writings in{" "}
          <span className="text-foreground">{activeTopic.name}</span>.
        </p>
      )}

      {articles.length === 0 ? (
        <p className="text-muted">Nothing here yet — check back soon.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <ArticleCard key={a.id} article={a} priority={i < 3} />
          ))}
        </div>
      )}
    </Container>
  );
}
