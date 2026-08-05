import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { LinkIcon } from "@/lib/linkIcons";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Links · ${site.name}`,
  description: `All of ${site.author}'s links in one place.`,
};

export default async function LinkHubPage() {
  const links = await prisma.linkItem.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-5 py-16">
      <Link href="/" className="mb-3">
        <LogoMark imgClassName="h-10" />
      </Link>
      <h1 className="font-display text-2xl font-semibold">{site.author}</h1>
      <p className="mt-1 text-center text-sm text-muted">{site.tagline}</p>

      <div className="mt-10 w-full space-y-3">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target={l.url.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center text-foreground">
              <LinkIcon icon={l.icon} size={24} />
            </span>
            <span className="flex-1 text-sm font-medium">{l.label}</span>
            <span
              aria-hidden
              className="text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground"
            >
              →
            </span>
          </a>
        ))}
        {links.length === 0 && (
          <p className="text-center text-sm text-muted">No links yet.</p>
        )}
      </div>

      <Link
        href="/"
        className="mt-12 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        {site.name.toLowerCase()} — visit the site →
      </Link>
    </main>
  );
}
