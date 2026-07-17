import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublishedArticles, getUsedTopics } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const articles = await getPublishedArticles({ take: 7 });
  const topics = await getUsedTopics();
  const [lead, ...rest] = articles;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <Container className="grid items-end gap-8 py-16 md:grid-cols-[1.6fr_1fr] md:py-24">
          <div className="animate-fade-up">
            <p className="mb-5 text-xs uppercase tracking-[0.25em] text-muted">
              The personal blog of Audarya Gupta
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              Ideas on finance,
              <br />
              tech &amp; the world.
            </h1>
            <p className="mt-6 max-w-xl font-serif text-lg text-muted">
              Essays and dispatches on markets, technology, geopolitics and the
              curiosities in between — written to be shared, because any idea
              that leaves you becomes twice as useful.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/writings"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                Read the writings <ArrowRight size={16} />
              </Link>
              <Link
                href="/newsletter"
                className="link-underline text-sm text-muted hover:text-foreground"
              >
                Get the Weekly Recap
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            {/* Image slot — replace with a portrait/brand image in the dashboard */}
            <div className="flex aspect-[4/5] items-center justify-center rounded-sm border border-line bg-subtle">
              <span className="font-display text-4xl italic text-muted/50">
                by AUDARYA
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Lead + latest */}
      <Container className="py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Latest writing</h2>
          <Link
            href="/writings"
            className="link-underline text-sm text-muted hover:text-foreground"
          >
            View all
          </Link>
        </div>

        {articles.length === 0 ? (
          <p className="text-muted">
            New essays are on the way. Subscribe below to get the first one.
          </p>
        ) : (
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
            {lead && (
              <Link
                href={`/writings/${lead.slug}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-line bg-subtle">
                  {lead.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lead.coverImage}
                      alt={lead.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-4xl italic text-muted/50">
                        by AUDARYA
                      </span>
                    </div>
                  )}
                </div>
                {lead.tags[0] && (
                  <span className="mt-5 block text-xs font-medium uppercase tracking-widest text-muted">
                    {lead.tags[0].name}
                  </span>
                )}
                <h3 className="mt-2 font-display text-3xl font-semibold leading-tight group-hover:opacity-80">
                  {lead.title}
                </h3>
                <p className="mt-3 max-w-xl font-serif text-muted">
                  {lead.excerpt}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {formatDate(lead.publishedAt)} · {lead.readingMinutes} min read
                </p>
              </Link>
            )}

            <div className="flex flex-col divide-y divide-line">
              {rest.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/writings/${a.slug}`}
                  className="group flex gap-4 py-4 first:pt-0"
                >
                  <div className="flex-1">
                    {a.tags[0] && (
                      <span className="text-[11px] font-medium uppercase tracking-widest text-muted">
                        {a.tags[0].name}
                      </span>
                    )}
                    <h4 className="mt-1 font-display text-lg font-semibold leading-snug group-hover:opacity-80">
                      {a.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(a.publishedAt)} · {a.readingMinutes} min
                    </p>
                  </div>
                  {a.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.coverImage}
                      alt={a.title}
                      className="h-20 w-24 flex-none rounded-sm border border-line object-cover"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>

      {/* Topics strip */}
      {topics.length > 0 && (
        <Container className="pb-8">
          <div className="flex flex-wrap items-center gap-3 border-y border-line py-6">
            <span className="text-xs uppercase tracking-widest text-muted">
              Explore by topic
            </span>
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/writings?topic=${t.slug}`}
                className="rounded-full border border-line px-4 py-1.5 text-sm transition hover:bg-subtle"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </Container>
      )}

      {/* Newsletter CTA */}
      <section className="bg-subtle/60">
        <Container className="grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">
              The Weekly Recap
            </h2>
            <p className="mt-3 max-w-md font-serif text-muted">
              Every week: the ten stories that actually mattered in finance,
              business and tech — internationally and in the US — distilled into
              a five-minute read.
            </p>
          </div>
          <SubscribeForm />
        </Container>
      </section>
    </>
  );
}
