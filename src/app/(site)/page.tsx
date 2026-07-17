import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Container } from "@/components/Container";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublishedArticles, getUsedTopics } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

const photos = {
  hero: "/audarya/audarya-parliament-hero.jpg",
  field: "/audarya/audarya-bu.jpg",
  portrait: "/audarya/audarya-portrait-blue.jpg",
  car: "/audarya/audarya-car.jpg",
};

export default async function HomePage() {
  const articles = await getPublishedArticles({ take: 7 });
  const topics = await getUsedTopics();
  const [lead, ...rest] = articles;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(180,120,70,0.14),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(35,70,110,0.13),transparent_30%),linear-gradient(180deg,var(--background),var(--subtle))]" />
        <div className="absolute left-1/2 top-0 -z-10 h-full w-px bg-line/70" />
        <Container className="grid min-h-[78vh] items-center gap-12 py-14 lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted backdrop-blur">
              <Sparkles size={13} /> Personal essays, finance, history & ideas
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.96] tracking-tight sm:text-6xl md:text-7xl">
              A sharper way to notice the world.
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-muted">
              Essays, dispatches and curated recaps from Audarya Gupta — moving
              between markets, policy, culture and curiosity with the energy of a
              field notebook.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/writings"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-foreground/10"
              >
                Read the writings
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/appointments"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-background/70 px-6 py-3 text-sm text-muted backdrop-blur transition hover:-translate-y-0.5 hover:text-foreground"
              >
                <CalendarDays size={16} /> Book a conversation
              </Link>
            </div>
          </div>

          <div className="relative h-[600px] max-h-[80vh] animate-fade-up [animation-delay:120ms]">
            <div className="absolute left-0 top-4 h-[76%] w-[62%] overflow-hidden rounded-[2rem] border border-line bg-card shadow-2xl shadow-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.hero}
                alt="Audarya Gupta at Parliament House"
                className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]"
              />
            </div>
            <div className="absolute bottom-3 right-0 h-[52%] w-[54%] overflow-hidden rounded-[1.5rem] border border-background bg-card shadow-2xl shadow-foreground/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.field}
                alt="Audarya Gupta at Boston University"
                className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
              />
            </div>
            <div className="absolute right-[7%] top-0 h-32 w-32 overflow-hidden rounded-full border-4 border-background bg-card shadow-xl shadow-foreground/15 sm:h-40 sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos.portrait}
                alt="Portrait of Audarya Gupta"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-[18%] left-7 max-w-[15rem] rounded-2xl border border-line bg-background/82 p-4 text-sm shadow-xl shadow-foreground/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Current obsessions
              </p>
              <p className="mt-2 font-serif text-base leading-snug">
                Finance, public life, technology, entrepreneurship and the small
                details that explain large systems.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["The Weekly Recap", "Ten important stories in business, finance and AI — sourced, linked, and approved before send."],
            ["Essays & field notes", "Writing that mixes economic instincts, personal observation and global context."],
            ["Appointments", "A direct calendar-backed way to request conversations, interviews or collaborations."],
          ].map(([title, copy], i) => (
            <div
              key={title}
              className="group rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
              style={{ animationDelay: `${i * 90}ms` }}
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

      <section className="border-y border-line bg-subtle/45">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              From notebook to newsletter
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              More movement, less brochure.
            </h2>
            <p className="mt-4 font-serif text-lg leading-relaxed text-muted">
              This site is built to feel editorial: a place for long-form work,
              public curiosity, private scheduling and weekly briefings — not a
              static profile page.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[photos.car, photos.field].map((src, i) => (
              <div
                key={src}
                className={`overflow-hidden rounded-2xl border border-line bg-card shadow-lg shadow-foreground/5 ${i === 1 ? "mt-10" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={i === 0 ? "Audarya with a model car" : "Audarya at Boston University"}
                  className="h-72 w-full object-cover transition duration-700 hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
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
                className="group block overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-subtle">
                  {lead.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lead.coverImage}
                      alt={lead.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos.hero}
                      alt="Audarya Gupta"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  {lead.tags[0] && (
                    <span className="text-xs font-medium uppercase tracking-widest text-muted">
                      {lead.tags[0].name}
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-3xl font-semibold leading-tight group-hover:opacity-80">
                    {lead.title}
                  </h3>
                  <p className="mt-3 max-w-xl font-serif text-muted">
                    {lead.excerpt}
                  </p>
                  <p className="mt-4 text-xs text-muted">
                    {formatDate(lead.publishedAt)} · {lead.readingMinutes} min read
                  </p>
                </div>
              </Link>
            )}

            <div className="grid gap-3">
              {rest.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/writings/${a.slug}`}
                  className="group grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:bg-subtle/50"
                >
                  <div>
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
                  </div>
                  <div className="h-24 w-24 overflow-hidden rounded-xl border border-line bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.coverImage || photos.portrait}
                      alt={a.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
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

      <section className="bg-[linear-gradient(135deg,var(--foreground),#3a3029)] text-background dark:bg-[linear-gradient(135deg,#ffffff,#d6d6d6)] dark:text-foreground">
        <Container className="grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] opacity-70">
              Weekly briefing
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold">
              The Weekly Recap
            </h2>
            <p className="mt-3 max-w-md font-serif text-lg opacity-75">
              Every week: ten stories that actually mattered in finance,
              business and AI — direct links, source images, and a personal note
              before it goes out.
            </p>
          </div>
          <div className="rounded-2xl bg-background p-5 text-foreground shadow-2xl shadow-black/20 dark:bg-foreground dark:text-background">
            <SubscribeForm />
          </div>
        </Container>
      </section>
    </>
  );
}
