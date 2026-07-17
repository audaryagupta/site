import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";

// A quiet little easter egg. Not linked in the nav; discoverable via the
// console hint or the hidden ✦ in the footer.
export const metadata: Metadata = {
  title: "The Signal",
  robots: { index: false, follow: false },
};

export default function SecretPage() {
  return (
    <Container className="flex min-h-[70vh] max-w-2xl flex-col items-center justify-center py-24 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-muted">
        You found the signal
      </p>
      <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        Curiosity is the whole game.
      </h1>
      <p className="mt-6 font-serif text-lg text-muted">
        Most people never look behind the curtain. You did. That instinct — to
        poke, to wonder, to follow the thread — is the same one behind every
        good essay on this site.
      </p>
      <p className="mt-8 text-sm text-muted">
        Reply to any of my emails with the word <em>“beetroot”</em> and I&apos;ll
        know you came from here.
      </p>
      <Link
        href="/"
        className="mt-10 link-underline text-sm text-muted hover:text-foreground"
      >
        ← back to the surface
      </Link>
    </Container>
  );
}
