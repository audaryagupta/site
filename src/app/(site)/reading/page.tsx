import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { getReadingItems, getSetting } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Now",
  description: "What Audarya is reading, watching and thinking about right now.",
};

const CATEGORY_LABELS: Record<string, string> = {
  now: "What I'm doing now",
  reading: "Reading",
  watching: "Watching & listening",
};

export default async function NowPage() {
  const [items, intro] = await Promise.all([
    getReadingItems(),
    getSetting(
      "now_intro",
      "A living page — a snapshot of what has my attention at the moment. Inspired by the /now movement."
    ),
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
    </Container>
  );
}
