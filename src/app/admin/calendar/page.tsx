"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Link2,
  Unlink,
} from "lucide-react";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  status: string;
}

const TZ = "Asia/Kolkata";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// y-m-d key of an ISO timestamp, in IST, so events land on the right day.
function istDayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return parts; // en-CA gives YYYY-MM-DD
}

function istTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Turns a raw Google OAuth error into plain, actionable guidance.
function explainGcalError(detail: string | null): string {
  const d = (detail || "").toLowerCase();
  if (d.includes("redirect_uri_mismatch"))
    return "The redirect URI below isn't registered on your Google Cloud OAuth client. Add it exactly (Authorized redirect URIs), save, wait a minute, then reconnect.";
  if (d.includes("access_denied"))
    return "Access was denied on the consent screen. If your Google Cloud consent screen is in 'Testing' mode, add your email as a Test user (or Publish the app), then reconnect.";
  if (d.includes("admin_policy") || d.includes("org_internal"))
    return "Your Google Workspace admin policy is blocking this app. Set the OAuth consent screen to 'Internal', or ask the admin to allow it, then reconnect.";
  if (d.includes("invalid_grant"))
    return "The authorization expired or was already used. Click Connect and complete the flow in one go.";
  if (d.includes("verif"))
    return "Google is blocking an unverified app requesting sensitive scopes. Use the Calendar-only connect (below) — it avoids the Drive/Docs scopes that trigger this.";
  return "Complete the Google consent screen and allow calendar access. If it keeps failing, check the redirect URI and consent-screen test users in Google Cloud.";
}

export default function CalendarPage() {
  const [status, setStatus] = useState<{
    connected: boolean;
    redirectUri: string;
    hasCredentials: boolean;
  } | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const banner =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("gcal")
      : null;
  const bannerDetail =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("detail")
      : null;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    try {
      const res = await fetch(
        `/api/admin/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      setEvents(data.events || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetch("/api/admin/google")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    if (status?.connected) loadEvents();
    else setLoading(false);
  }, [status?.connected, loadEvents]);

  async function disconnect() {
    if (!confirm("Disconnect the linked Google Calendar?")) return;
    await fetch("/api/admin/google", { method: "DELETE" });
    setStatus((s) => (s ? { ...s, connected: false } : s));
    setEvents([]);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  // Group events by IST day.
  const byDay = new Map<string, CalEvent[]>();
  for (const e of events) {
    const key = istDayKey(e.start);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  // Build the calendar grid (leading blanks + days of month).
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = istDayKey(new Date().toISOString());

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Calendar</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Your Google Calendar, inside the console. Events are shown in IST
        (Asia/Kolkata) across the calendars selected for conflict-checking on the
        Appointments page.
      </p>

      {banner === "connected" && (
        <p className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm">
          Google Calendar connected.
        </p>
      )}
      {(banner === "error" || banner === "noretoken") && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Couldn&apos;t connect Google Calendar.</p>
          <p className="mt-1 text-muted">{explainGcalError(bannerDetail)}</p>
          {bannerDetail && (
            <p className="mt-1 text-xs text-muted">
              Google said: <code>{bannerDetail}</code>
            </p>
          )}
        </div>
      )}

      {status && !status.connected && (
        <div className="mt-6 rounded-lg border border-line bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange size={18} /> Connect your Google Calendar
          </div>
          {!status.hasCredentials ? (
            <p className="mt-2 text-sm text-muted">
              Google OAuth credentials aren&apos;t set on this deployment yet.
            </p>
          ) : (
            <>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                A one-time authorization lets the site read your calendar (for
                this view and booking conflict checks) and create/cancel
                appointment events. First add this redirect URI in Google Cloud
                → Clients → your web client:
              </p>
              <code className="mt-2 block break-all rounded-md bg-subtle px-3 py-2 text-xs">
                {status.redirectUri}
              </code>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href="/api/admin/google/connect"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                >
                  <Link2 size={15} /> Connect Google Calendar
                </a>
                <a
                  href="/api/admin/google/connect?extended=1"
                  className="text-xs text-muted underline hover:text-foreground"
                >
                  Also enable Drive/Docs (log export &amp; letterhead)
                </a>
              </div>
              <p className="mt-2 text-xs text-muted">
                Calendar-only avoids Google&apos;s Drive/Docs verification
                prompt, so it connects even before the app is verified.
              </p>
            </>
          )}
        </div>
      )}

      {status?.connected && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-44 text-center font-display text-lg font-semibold">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-500"
            >
              <Unlink size={13} /> Disconnect
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm">
              {error} — you may need to reconnect the calendar.
            </p>
          )}

          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-card">
            <div className="grid grid-cols-7 border-b border-line text-center text-xs uppercase tracking-widest text-muted">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const key =
                  d != null
                    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(
                        d
                      ).padStart(2, "0")}`
                    : "";
                const dayEvents = key ? byDay.get(key) || [] : [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={i}
                    className="min-h-24 border-b border-r border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0"
                  >
                    {d != null && (
                      <>
                        <div
                          className={
                            "mb-1 text-xs " +
                            (isToday
                              ? "flex h-5 w-5 items-center justify-center rounded-full bg-foreground font-semibold text-background"
                              : "text-muted")
                          }
                        >
                          {d}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 4).map((e) => (
                            <div
                              key={e.id}
                              title={`${e.title}${
                                e.location ? ` · ${e.location}` : ""
                              }`}
                              className="truncate rounded bg-subtle px-1.5 py-0.5 text-[11px]"
                            >
                              {!e.allDay && (
                                <span className="text-muted">
                                  {istTime(e.start)}{" "}
                                </span>
                              )}
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 4 && (
                            <div className="px-1.5 text-[10px] text-muted">
                              +{dayEvents.length - 4} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {loading && (
            <p className="mt-3 text-sm text-muted">Loading events…</p>
          )}
        </>
      )}
    </div>
  );
}
