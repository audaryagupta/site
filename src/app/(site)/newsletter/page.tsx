import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getSentNewsletters } from "@/lib/queries";
import { getSiteContent, pickStr } from "@/lib/siteContent";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Newsletter — The Weekly Recap",
  description:
    "The week's ten best stories in finance, business and tech, every week.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  const issues = await getSentNewsletters();
  const content = await getSiteContent();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          {pickStr(content, "newsletter.eyebrow", "The Weekly Recap")}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          {pickStr(content, "newsletter.title", "Ten stories. Five minutes. Every week.")}
        </h1>
        <p className="mt-5 font-serif text-lg text-muted">
          {pickStr(content, "newsletter.sub", "A curated recap of the week's most important news in finance, business and technology — internationally and in the United States — delivered as a clean, clickable digest with a personal note.")}
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <SubscribeForm />
        </div>
        <p className="mt-3 text-xs text-muted">
          {pickStr(content, "newsletter.disclaimer", "No spam. Unsubscribe anytime with one click.")}
        </p>
      </div>

      {issues.length > 0 && (
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-6 font-display text-2xl font-semibold">
            {pickStr(content, "newsletter.past.heading", "Past issues")}
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {issues.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/newsletter/${n.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:opacity-80"
                >
                  <span className="font-display text-lg">{n.subject}</span>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {formatDate(n.sentAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}
