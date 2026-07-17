import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  publishedAt?: Date | string | null;
  readingMinutes?: number;
  tags?: { name: string; slug: string }[];
}

export function ArticleCard({
  article,
  priority = false,
}: {
  article: ArticleCardData;
  priority?: boolean;
}) {
  const topic = article.tags?.[0]?.name;
  return (
    <article className="group flex flex-col">
      <Link
        href={`/writings/${article.slug}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-sm border border-line bg-subtle"
      >
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LogoMark imgClassName="h-10 opacity-30" />
          </div>
        )}
      </Link>

      <div className="mt-4">
        {topic && (
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            {topic}
          </span>
        )}
        <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug">
          <Link href={`/writings/${article.slug}`} className="hover:opacity-80">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">
          {article.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span>{formatDate(article.publishedAt)}</span>
          {article.readingMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{article.readingMinutes} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
