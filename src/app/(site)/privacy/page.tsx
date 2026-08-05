import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How byAudarya handles personal information.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-prose py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">
        Website policy
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <div className="prose-editorial mt-8">
        <p>
          This website collects only the information you choose to provide, such
          as your name, email address, phone number, message, newsletter
          subscription details, appointment request details, comments and any
          files or content you submit through the Studio or public forms.
        </p>
        <p>
          Your information is used to operate the website, respond to messages,
          send newsletters you requested, manage subscriptions and unsubscribes,
          schedule appointments, send calendar invitations, prevent abuse, keep
          activity logs, and improve the site.
        </p>
        <p>
          To understand how the site is used, we keep first-party, aggregate
          analytics — pages viewed, visit counts, approximate visit duration,
          device type, referring source and a coarse location (country, region
          and city) derived from your IP address. We do not store your IP
          address itself, and we do not use third-party advertising trackers or
          build profiles to identify you personally.
        </p>
        <p>
          The site may use trusted third-party services such as Google, Fly.io,
          email providers, analytics, CAPTCHA/security providers and AI/news
          services where necessary to operate these features. Information is not
          sold. It may be shared only where needed to run the service, comply
          with law, protect the website, or complete a request you made.
        </p>
        <p>
          Newsletter emails include an unsubscribe link. You can also ask for
          corrections or deletion where applicable by writing to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
        <p>
          No internet service is perfectly secure or permanently available. The
          website is provided on a reasonable-efforts basis and may be changed,
          paused or discontinued at any time.
        </p>
      </div>
    </Container>
  );
}
