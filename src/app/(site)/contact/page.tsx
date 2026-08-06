import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Mail } from "lucide-react";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { SocialIcons } from "@/components/SocialIcons";
import { getPublicAvailability } from "@/lib/queries";
import { getSiteContent, pickStr } from "@/lib/siteContent";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Audarya Gupta or book an appointment.",
  alternates: { canonical: "/contact" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const revalidate = 300;

export default async function ContactPage() {
  const availability = await getPublicAvailability();
  const online = availability.filter((a) => a.kind === "online");
  const offline = availability.filter((a) => a.kind === "offline");
  const content = await getSiteContent();
  const chips = [
    pickStr(content, "contact.chip1", "Editorial"),
    pickStr(content, "contact.chip2", "Business"),
    pickStr(content, "contact.chip3", "Speaking"),
  ];
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-subtle/35">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              {pickStr(content, "contact.eyebrow", "Contact")}
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              {pickStr(content, "contact.title", "Let's turn a good idea into a conversation.")}
            </h1>
            <p className="mt-5 max-w-xl font-serif text-xl leading-relaxed text-muted">
              {pickStr(content, "contact.sub", "Whether it's a collaboration, a question, an interview, or a calendar request — send the context and I'll reply from there.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:-translate-y-0.5"
              >
                <Mail size={16} /> {site.email}
              </a>
              <Link
                href="/appointments"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-background/70 px-5 py-3 text-sm text-muted backdrop-blur transition hover:-translate-y-0.5 hover:text-foreground"
              >
                <CalendarCheck size={16} /> {pickStr(content, "contact.apptButton", "Request time")}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-card p-8 shadow-2xl shadow-foreground/5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {pickStr(content, "contact.before.label", "Before you write")}
            </p>
            <p className="mt-6 font-serif text-4xl leading-tight">
              {pickStr(content, "contact.before.body", "Send the context: what you want to discuss, why it matters, and what a useful outcome would look like.")}
            </p>
            <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
              {chips.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line px-3 py-2 text-center text-xs uppercase tracking-widest text-muted"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-card p-6 shadow-xl shadow-foreground/5 md:p-8">
          <h2 className="font-display text-3xl font-semibold">{pickStr(content, "contact.message.heading", "Send a message")}</h2>
          <p className="mt-2 text-sm text-muted">
            {pickStr(content, "contact.message.sub", "I read everything that comes in.")}
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>

        <section id="book" className="space-y-6">
          <div className="rounded-2xl border border-line bg-card p-6 md:p-8">
            <h2 className="font-display text-3xl font-semibold">
              {pickStr(content, "contact.book.heading", "Book an appointment")}
            </h2>
            <p className="mt-2 font-serif text-muted">
              {pickStr(content, "contact.book.body", "Request a Google Meet, Zoom, or in-person meeting. Name, email, phone with country code, purpose, date, time and CAPTCHA are required so invitations and updates reach the right person.")}
            </p>

            {availability.length > 0 && (
              <div className="mt-6 rounded-xl border border-line bg-subtle/50 p-4 text-sm">
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
              <Link
                href="/appointments"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-foreground/10"
              >
                <CalendarCheck size={17} />
                {pickStr(content, "contact.bookButton", "Make an appointment")}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-subtle/60 p-6 text-sm text-muted">
            <p>{pickStr(content, "contact.location", "New Delhi, India")}</p>
            <div className="mt-4">
              <SocialIcons size={18} />
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
