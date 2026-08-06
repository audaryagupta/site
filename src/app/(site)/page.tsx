import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, PenLine } from "lucide-react";
import { Container } from "@/components/Container";
import { SubscribeForm } from "@/components/SubscribeForm";
import { LogoMark } from "@/components/Logo";
import { EditableText } from "@/components/site-editor/EditableText";
import { EditableButton } from "@/components/site-editor/EditableButton";
import { getPublishedArticles, getUsedTopics } from "@/lib/queries";
import { getSiteContent, pickText, pickButton } from "@/lib/siteContent";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const notes = [
  "Finance",
  "History",
  "Public life",
  "Technology",
  "Markets",
  "Curiosity",
];

export default async function HomePage() {
  const articles = await getPublishedArticles({ take: 7 });
  const topics = await getUsedTopics();
  const [lead, ...rest] = articles;
  const content = await getSiteContent();

  const heroEyebrow = pickText(content, "home.hero.eyebrow", "The personal blog of Audarya Gupta");
  const heroTitle = pickText(content, "home.hero.title", "Ideas worth passing on.");
  const heroSub = pickText(
    content,
    "home.hero.sub",
    "Essays, field notes and curated briefings on finance, history, public life, technology and the questions that keep returning."
  );
  const heroPrimary = pickButton(content, "home.hero.primary", "Read the writings", "/writings");
  const heroSecondary = pickButton(content, "home.hero.secondary", "Get the Weekly Recap", "/newsletter");
  const quoteText = pickText(content, "home.quote.text", "“Any idea that leaves you becomes twice as useful.”");
  const quoteSub = pickText(content, "home.quote.sub", "Notes on economics, ambition and attention");

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(122,88,54,0.13),transparent_30%),linear-gradient(180deg,var(--background),var(--subtle))]" />
        <Container className="grid min-h-[74vh] gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <EditableText
              id="home.hero.eyebrow"
              as="p"
              text={heroEyebrow.text}
              scale={heroEyebrow.scale}
              className="mb-5 text-xs uppercase tracking-[0.25em] text-muted"
            />
            <EditableText
              id="home.hero.title"
              as="h1"
              text={heroTitle.text}
              scale={heroTitle.scale}
              className="max-w-4xl font-display text-5xl font-semibold leading-[0.96] tracking-tight sm:text-6xl md:text-7xl"
            />
            <EditableText
              id="home.hero.sub"
              as="p"
              text={heroSub.text}
              scale={heroSub.scale}
              className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-muted"
            />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <EditableButton
                id="home.hero.primary"
                label={heroPrimary.label}
                href={heroPrimary.href}
                className="group inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-foreground/10"
              >
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </EditableButton>
              <EditableButton
                id="home.hero.secondary"
                label={heroSecondary.label}
                href={heroSecondary.href}
                className="link-underline text-sm text-muted hover:text-foreground"
              />
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="rounded-[2rem] border border-line bg-card p-6 shadow-2xl shadow-foreground/5">
              <div className="flex items-center justify-between border-b border-line pb-5">
                <LogoMark imgClassName="h-8 opacity-80" />
                <PenLine size={18} className="text-muted" />
              </div>
              <div className="py-8">
                <EditableText
                  id="home.quote.text"
                  as="p"
                  text={quoteText.text}
                  scale={quoteText.scale}
                  className="font-serif text-4xl leading-tight md:text-5xl"
                />
                <EditableText
                  id="home.quote.sub"
                  as="p"
                  text={quoteSub.text}
                  scale={quoteSub.scale}
                  className="mt-5 text-sm uppercase tracking-[0.22em] text-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-3">
                {notes.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-line px-3 py-2 text-center text-xs uppercase tracking-widest text-muted"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Essays", "Longer pieces shaped around argument, observation and context."],
            ["The Weekly Recap", "Ten important stories in business, finance and AI — sourced, linked, and approved before send."],
            ["Appointments", "A direct calendar-backed way to request conversations, interviews or collaborations."],
          ].map(([title, copy], i) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
            >
              <span className="text-xs uppercase tracking-[0.22em] text-muted">
                0{i + 1}
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                {title}
              </h2>
              <p className="mt-3 font-serif leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="py-16 pt-4">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              Latest writing
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Read the newest pieces.
            </h2>
          </div>
          <Link
            href="/writings"
            className="link-underline hidden text-sm text-muted hover:text-foreground sm:inline"
          >
            View all
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-8">
            <p className="font-serif text-lg text-muted">
              New essays are on the way. Subscribe below to get the first one.
            </p>
          </div>
        ) : (
          <div className="grid gap-12 md:grid-cols-[1.25fr_1fr]">
            {lead && (
              <Link
                href={`/writings/${lead.slug}`}
                className="group block rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
              >
                {lead.tags[0] && (
                  <span className="text-xs font-medium uppercase tracking-widest text-muted">
                    {lead.tags[0].name}
                  </span>
                )}
                <h3 className="mt-3 font-display text-4xl font-semibold leading-tight group-hover:opacity-80">
                  {lead.title}
                </h3>
                <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-muted">
                  {lead.excerpt}
                </p>
                <p className="mt-5 text-xs text-muted">
                  {formatDate(lead.publishedAt)} · {lead.readingMinutes} min read
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
                  <span>Continue reading</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            )}

            <div className="grid gap-3">
              {rest.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/writings/${a.slug}`}
                  className="group rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:bg-subtle/50"
                >
                  {a.tags[0] && (
                    <span className="text-[11px] font-medium uppercase tracking-widest text-muted">
                      {a.tags[0].name}
                    </span>
                  )}
                  <h4 className="mt-1 font-display text-xl font-semibold leading-snug group-hover:opacity-80">
                    {a.title}
                  </h4>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(a.publishedAt)} · {a.readingMinutes} min
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>

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
                className="rounded-full border border-line px-4 py-1.5 text-sm transition hover:-translate-y-0.5 hover:bg-subtle"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </Container>
      )}

      <section className="bg-subtle/60">
        <Container className="grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              Weekly briefing
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold">
              The Weekly Recap
            </h2>
            <p className="mt-3 max-w-md font-serif text-lg text-muted">
              Every week: ten stories that actually mattered in finance,
              business and AI — direct links, source images, and a personal note
              before it goes out.
            </p>
          </div>
          <SubscribeForm />
        </Container>
      </section>
    </>
  );
}
