import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using byAudarya.",
};

export default function TermsPage() {
  return (
    <Container className="max-w-prose py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">
        Website policy
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Terms of Use
      </h1>
      <div className="prose-editorial mt-8">
        <p>
          By using this website, you agree to use it lawfully and respectfully.
          Do not misuse forms, attempt to access private Studio areas, interfere
          with the site, submit unlawful or harmful content, or impersonate
          another person.
        </p>
        <p>
          All writing, design, images, emails, downloads and other materials on
          this website are provided for general informational, educational and
          personal editorial purposes only. They are not professional, legal,
          financial, investment, tax, medical or other regulated advice. You are
          responsible for your own decisions and should seek qualified advice
          before relying on anything you read here.
        </p>
        <p>
          To the fullest extent permitted by applicable law, Audarya Gupta,
          byAudarya and associated contributors are not liable for any direct,
          indirect, incidental, consequential, special, punitive or other losses
          arising from use of this website, reliance on its content, appointment
          scheduling, email delays, broken links, third-party services,
          inaccuracies, interruptions, data loss or security incidents.
        </p>
        <p>
          External links are provided for convenience. Their inclusion does not
          mean endorsement, and byAudarya is not responsible for third-party
          content, policies, availability or accuracy.
        </p>
        <p>
          Content on this site may not be copied, republished, scraped, trained
          on, sold or redistributed without written permission, except for brief
          quotations with clear attribution and a link back to the original page.
        </p>
        <p>
          These terms may be updated from time to time. Continued use of the
          website means you accept the current version. Questions can be sent to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </Container>
  );
}
