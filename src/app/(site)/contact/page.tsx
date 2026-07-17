import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { AppointmentBooker } from "@/components/AppointmentBooker";
import { SocialIcons } from "@/components/SocialIcons";
import { getPublicAvailability } from "@/lib/queries";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Audarya Gupta or book an appointment.",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const revalidate = 300;

export default async function ContactPage() {
  const availability = await getPublicAvailability();
  const online = availability.filter((a) => a.kind === "online");
  const offline = availability.filter((a) => a.kind === "offline");
  return (
    <Container className="py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-5xl font-semibold tracking-tight">
          Let&apos;s talk.
        </h1>
        <p className="mt-4 font-serif text-lg text-muted">
          Whether it&apos;s an idea, a collaboration, or a conversation — reach
          out or book a time on my calendar.
        </p>
      </header>

      <div className="grid gap-16 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-semibold">Send a message</h2>
          <p className="mt-2 text-sm text-muted">
            I read everything that comes in.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>

          <div className="mt-10 space-y-3 border-t border-line pt-6 text-sm text-muted">
            <p>
              Email:{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-foreground hover:underline"
              >
                {site.email}
              </a>
            </p>
            <p>New Delhi, India</p>
            <div className="pt-2">
              <SocialIcons size={18} />
            </div>
          </div>
        </section>

        <section id="book">
          <h2 className="font-display text-2xl font-semibold">
            Book an appointment
          </h2>
          <p className="mt-2 text-sm text-muted">
            Request a Google Meet, Zoom, or in-person meeting. I&apos;ll confirm
            from my calendar.
          </p>

          {availability.length > 0 && (
            <div className="mt-6 rounded-lg border border-line bg-subtle/50 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted">
                Current availability
              </p>
              {online.length > 0 && (
                <p className="mt-2">
                  <strong>Online:</strong>{" "}
                  {online
                    .map(
                      (w) => `${DAYS[w.dayOfWeek]} ${w.startTime}–${w.endTime}`
                    )
                    .join(" · ")}
                </p>
              )}
              {offline.length > 0 && (
                <p className="mt-1">
                  <strong>In person:</strong>{" "}
                  {offline
                    .map(
                      (w) =>
                        `${w.city || "TBC"} — ${DAYS[w.dayOfWeek]} ${w.startTime}–${w.endTime}`
                    )
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <AppointmentBooker />
          </div>
        </section>
      </div>
    </Container>
  );
}
