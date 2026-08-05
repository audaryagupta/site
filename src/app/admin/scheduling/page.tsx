"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays, CalendarRange } from "lucide-react";
import { cx } from "@/lib/utils";
import AppointmentsPage from "../appointments/page";
import CalendarPage from "../calendar/page";
import AvailabilityPage from "../availability/page";

const TABS = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "calendar", label: "Calendar", icon: CalendarRange },
  { key: "availability", label: "Availability", icon: CalendarClock },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Scheduling brings the three related tools — appointment requests, the Google
// calendar view, and recurring availability windows — under one roof.
export default function SchedulingPage() {
  const [tab, setTab] = useState<TabKey>("appointments");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Scheduling</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Appointment requests, your Google calendar, and the availability windows
        shown to visitors — all in one place.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-line">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "-mb-px inline-flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm transition",
                active
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "appointments" && <AppointmentsPage />}
        {tab === "calendar" && <CalendarPage />}
        {tab === "availability" && <AvailabilityPage />}
      </div>
    </div>
  );
}
