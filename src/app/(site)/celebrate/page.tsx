import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { GreetingForm } from "@/components/GreetingForm";

export const metadata: Metadata = {
  title: "Send a little joy",
  robots: { index: false, follow: false },
};

export default function CelebratePage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          A hidden corner
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Ask for a birthday or anniversary note
        </h1>
        <p className="mt-3 font-serif text-muted">
          A small easter egg: tell me about someone&apos;s birthday or
          anniversary and I&apos;ll send them a personal note from byAudarya. No
          catch — just a bit of joy.
        </p>
        <div className="mt-8">
          <GreetingForm />
        </div>
      </div>
    </Container>
  );
}
