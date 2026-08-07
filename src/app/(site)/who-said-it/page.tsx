import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { QuoteGame } from "@/components/QuoteGame";
import { buildQuoteRounds } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Who said it?",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WhoSaidItPage() {
  const quoteRounds = await buildQuoteRounds();
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          A hidden game
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Who said it?
        </h1>
        <p className="mt-3 font-serif text-muted">
          Three quotes each round. One is genuinely mine — the other two belong
          to far more famous people. Guess which line is Audarya&apos;s. Get a
          certificate with your score at the end.
        </p>
        <div className="mt-8">
          <QuoteGame rounds={quoteRounds} />
        </div>
      </div>
    </Container>
  );
}
