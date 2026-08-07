import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { LinkIcon } from "@/lib/linkIcons";
import { LogoMark } from "@/components/Logo";
import { getSiteContent, pickText } from "@/lib/siteContent";
import { QR_QUOTE_DEFAULT, TAGLINE_DEFAULT } from "@/lib/siteText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Links · ${site.name}`,
  description: `All of ${site.author}'s links in one place.`,
};

export default async function LinkHubPage() {
  const [links, content] = await Promise.all([
    prisma.linkItem.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    getSiteContent(),
  ]);
  const quote = pickText(content, "qr.quote", QR_QUOTE_DEFAULT).text;
  const tagline = pickText(content, "global.tagline", TAGLINE_DEFAULT).text;

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      {/* On-brand backdrop, matching the site hero */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(122,88,54,0.16),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(122,88,54,0.10),transparent_35%),linear-gradient(180deg,var(--background),var(--subtle))]" />

      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-5 py-16">
        {/* Logo + brand */}
        <Link href="/" className="animate-fade-up">
          <LogoMark imgClassName="h-12" />
        </Link>

        <p className="mt-5 animate-fade-up text-center font-serif text-2xl italic leading-snug [animation-delay:80ms] sm:text-3xl">
          {`“${quote}”`}
        </p>

        <p className="mt-3 animate-fade-up text-xs uppercase tracking-[0.25em] text-muted [animation-delay:140ms]">
          {tagline}
        </p>

        <div className="mt-4 h-px w-16 animate-fade-up bg-line [animation-delay:180ms]" />

        {/* Links */}
        <div className="mt-9 w-full space-y-3">
          {links.map((l, i) => (
            <a
              key={l.id}
              href={l.url}
              target={l.url.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{ animationDelay: `${220 + i * 55}ms` }}
              className="group flex animate-fade-up items-center gap-4 rounded-2xl border border-line bg-card/80 px-5 py-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-xl hover:shadow-foreground/5"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-subtle text-foreground transition group-hover:bg-foreground group-hover:text-background">
                <LinkIcon icon={l.icon} size={22} />
              </span>
              <span className="flex-1 text-sm font-medium">{l.label}</span>
              <ArrowUpRight
                size={18}
                className="text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
              />
            </a>
          ))}
          {links.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-card/70 p-8 text-center text-sm text-muted">
              Links coming soon.
            </p>
          )}
        </div>

        <Link
          href="/"
          className="link-underline mt-12 animate-fade-up text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground [animation-delay:600ms]"
        >
          Enter the site →
        </Link>
      </div>
    </main>
  );
}
