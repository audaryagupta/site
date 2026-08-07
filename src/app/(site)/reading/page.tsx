import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { getReadingItems, getSetting, getLatestRecap } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

const CAT_COLOR: Record<string, string> = {
  finance: "#047857",
  business: "#b45309",
  tech: "#1d4ed8",
  technology: "#1d4ed8",
};
function catColor(name?: string) {
  return CAT_COLOR[(name || "").trim().toLowerCase()] || "#7c3aed";
}
function recapLink(title: string, url?: string) {
  const u = (url || "").trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://news.google.com/search?q=${encodeURIComponent(title)}`;
}

export const metadata: Metadata = {
  title: "Now",
  description: "What Audarya is reading, watching and thinking about right now.",
  alternates: { canonical: "/reading" },
};

const CATEGORY_LABELS: Record<string, string> = {
  now: "What I'm doing now",
  reading: "Reading",
  watching: "Watching & listening",
};

export default async function NowPage() {
  const [items, intro, recap] = await Promise.all([
    getReadingItems(),
    getSetting(
      "now_intro",
      "A living page — a snapshot of what has my attention at the moment. Inspired by the /now movement."
    ),
    getLatestRecap(),
  ]);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const order = ["now", "reading", "watching"];

  return (
    <Container className="max-w-3xl py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Now</p>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
        Right now
      </h1>
      <p className="mt-5 font-serif text-lg text-muted">{intro}</p>

      {items.length === 0 ? (
        <p className="mt-10 text-muted">This page is being curated. Check back soon.</p>
      ) : (
        <div className="mt-12 space-y-12">
          {order
            .filter((cat) => grouped[cat]?.length)
            .map((cat) => (
              <section key={cat}>
                <h2 className="mb-4 font-display text-2xl font-semibold">
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <ul className="divide-y divide-line border-y border-line">
                  {grouped[cat].map((item) => (
                    <li key={item.id} className="py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-serif text-lg">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-underline"
                            >
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                        </p>
                        {item.author && (
                          <span className="whitespace-nowrap text-sm text-muted">
                            {item.author}
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="mt-1 text-sm text-muted">{item.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      {recap && (
        <section className="mt-16 border-t border-line pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                From the last Weekly Recap
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                In the news
              </h2>
            </div>
            {recap.sentAt && (
              <span className="text-xs text-muted">
                Sent {formatDate(recap.sentAt)}
              </span>
            )}
          </div>

          <ul className="mt-8 space-y-6">
            {recap.stories.map((s) => (
              <li
                key={s.rank}
                className="flex gap-4 border-b border-line pb-6 last:border-0"
              >
                <span
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: catColor(s.category) }}
                >
                  {s.rank}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-medium uppercase tracking-widest"
                    style={{ color: catColor(s.category) }}
                  >
                    {s.category} · {s.region}
                  </p>
                  <a
                    href={recapLink(s.title, s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-display text-xl font-semibold leading-snug hover:opacity-80"
                  >
                    {s.title}
                  </a>
                  <p className="mt-1.5 font-serif leading-relaxed text-muted">
                    {s.summary}
                  </p>
                  <a
                    href={recapLink(s.title, s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline mt-2 inline-block text-sm text-muted hover:text-foreground"
                  >
                    Read the full story{s.source ? ` · ${s.source}` : ""} →
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/newsletter"
            className="link-underline mt-8 inline-block text-sm text-muted hover:text-foreground"
          >
            Get this in your inbox every week — subscribe to The Weekly Recap →
          </Link>
        </section>
      )}
    </Container>
  );
}
