import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/Container";
import { AppointmentBooker } from "@/components/AppointmentBooker";
import { getPublicAvailability, getSpecialAvailability } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Request a Google Meet, Zoom, or in-person meeting with Audarya.",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const revalidate = 300;

export default async function AppointmentsPage() {
  const [availability, specials] = await Promise.all([
    getPublicAvailability(),
    getSpecialAvailability(),
  ]);
  const online = availability.filter((a) => a.kind === "online");
  const offline = availability.filter((a) => a.kind === "offline");
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingSpecials = specials
    .filter((s) => (s.endDate || s.startDate) >= todayStr)
    .slice(0, 6);
  const fmtRange = (s: (typeof specials)[number]) => {
    const f = (d: string) =>
      new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    const dates =
      s.endDate && s.endDate !== s.startDate
        ? `${f(s.startDate)}–${f(s.endDate)}`
        : f(s.startDate);
    return s.status === "unavailable"
      ? `${dates}: away`
      : `${dates}: ${s.startTime}–${s.endTime}${s.kind === "offline" ? ` (${s.city || "in person"})` : ""}`;
  };

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={15} /> Back to contact
        </Link>

        <header className="mt-6 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">
            Let&apos;s find a time
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Book an appointment
          </h1>
          <p className="mt-4 font-serif text-lg text-muted">
            Pick how you&apos;d like to meet, choose a time, and send your
            request. I&apos;ll confirm from my calendar and email you the
            details.
          </p>
        </header>

        {(availability.length > 0 || upcomingSpecials.length > 0) && (
          <div className="mt-8 rounded-lg border border-line bg-subtle/50 p-4 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted">
              Current availability
            </p>
            {online.length > 0 && (
              <p className="mt-2">
                <strong>Online:</strong>{" "}
                {online
                  .map((w) => `${DAYS[w.dayOfWeek]} ${w.startTime}–${w.endTime}`)
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
            {upcomingSpecials.length > 0 && (
              <p className="mt-2 border-t border-line pt-2 text-muted">
                <span className="font-medium text-foreground">
                  Special dates:
                </span>{" "}
                {upcomingSpecials.map((s) => fmtRange(s)).join(" · ")}
              </p>
            )}
          </div>
        )}

        <div className="mt-10">
          <AppointmentBooker
            variant="page"
            windows={availability.map((w) => ({
              kind: w.kind,
              city: w.city,
              dayOfWeek: w.dayOfWeek,
              startTime: w.startTime,
              endTime: w.endTime,
            }))}
            specials={specials.map((w) => ({
              status: w.status,
              kind: w.kind,
              city: w.city,
              startDate: w.startDate,
              endDate: w.endDate,
              startTime: w.startTime,
              endTime: w.endTime,
            }))}
          />
        </div>
      </div>
    </Container>
  );
}
