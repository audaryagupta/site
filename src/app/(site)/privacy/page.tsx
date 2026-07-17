import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How byAudarya handles your data.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-prose py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Privacy
      </h1>
      <div className="prose-editorial mt-8">
        <p>
          byAudarya collects only what you choose to share: your name and email
          when you subscribe to the newsletter or send a message, and any
          details you provide when booking an appointment.
        </p>
        <p>
          Your email is used solely to send you the content you signed up for.
          Every newsletter includes a one-click unsubscribe link, and your data
          is never sold or shared with third parties.
        </p>
        <p>
          Appointment details are used only to schedule and confirm your
          meeting via Google Calendar.
        </p>
        <p>
          Questions? Write to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </Container>
  );
}
