import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LegalBody } from "@/components/LegalBody";
import { getSiteContent, pickStr } from "@/lib/siteContent";
import { TERMS_BODY_DEFAULT } from "@/lib/siteText";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using byAudarya.",
};

export default async function TermsPage() {
  const content = await getSiteContent();
  return (
    <Container className="max-w-prose py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">
        {pickStr(content, "legal.eyebrow", "Website policy")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {pickStr(content, "legal.terms.title", "Terms of Use")}
      </h1>
      <LegalBody text={pickStr(content, "legal.terms.body", TERMS_BODY_DEFAULT)} />
    </Container>
  );
}
