import { Container } from "@/components/Container";

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ok = searchParams.status === "ok";
  return (
    <Container className="max-w-xl py-24 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        {ok ? "You're unsubscribed." : "Hmm."}
      </h1>
      <p className="mt-4 font-serif text-lg text-muted">
        {ok
          ? "You won't receive any more emails. If this was a mistake, you can resubscribe anytime from the newsletter page."
          : "That unsubscribe link looks invalid or expired. Write to audarya@venturebuz.com and I'll sort it out."}
      </p>
    </Container>
  );
}
