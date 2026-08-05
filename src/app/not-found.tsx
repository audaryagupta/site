import Link from "next/link";
import type { Metadata } from "next";
import { NotFoundGame } from "@/components/NotFoundGame";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-display text-6xl font-semibold tracking-tight">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        This page wandered off the page.
      </h1>
      <p className="mt-3 max-w-md font-serif text-lg leading-relaxed text-muted">
        The link you followed doesn&apos;t exist (anymore). No pressure — stretch
        your legs with a quick game while you decide where to go next.
      </p>

      <div className="mt-8 w-full">
        <NotFoundGame />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
        >
          Back home
        </Link>
        <Link
          href="/writings"
          className="rounded-md border border-line px-4 py-2 hover:bg-subtle"
        >
          Read the writings
        </Link>
      </div>
    </main>
  );
}
