import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LegalBody } from "@/components/LegalBody";
import { getSiteContent, pickStr } from "@/lib/siteContent";
import { PRIVACY_BODY_DEFAULT } from "@/lib/siteText";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How byAudarya handles personal information.",
};

export default async function PrivacyPage() {
  const content = await getSiteContent();
  return (
    <Container className="max-w-prose py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">
        {pickStr(content, "legal.eyebrow", "Website policy")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {pickStr(content, "legal.privacy.title", "Privacy Policy")}
      </h1>
      <LegalBody text={pickStr(content, "legal.privacy.body", PRIVACY_BODY_DEFAULT)} />
    </Container>
  );
}
