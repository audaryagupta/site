"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Link2,
  MapPin,
  Plus,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import {
  DEFAULT_TIMEZONE,
  tzLabel,
  utcToZonedWallTime,
  zonedWallTimeToUtc,
} from "@/lib/timezones";
import { cx } from "@/lib/utils";

interface CalEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  status: string;
  editable: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// y-m-d key of an ISO timestamp, in the preferred zone, so events land on the
// right day.
function dayKey(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function timeIn(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function longDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

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

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type PanelState =
  | { mode: "view"; event: CalEvent }
  | { mode: "edit"; event: CalEvent }
  | { mode: "create"; day: string };

export default function CalendarPage() {
  const [status, setStatus] = useState<{
    connected: boolean;
    redirectUri: string;
    hasCredentials: boolean;
  } | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tz, setTz] = useState(DEFAULT_TIMEZONE);
  const [view, setView] = useState<"month" | "week">("month");
  // `cursor` anchors both views (month view uses its month; week view the week
  // that contains it).
  const [cursor, setCursor] = useState(new Date());
  const [panel, setPanel] = useState<PanelState | null>(null);

  const banner =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("gcal")
      : null;
  const bannerDetail =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("detail")
      : null;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.site_timezone) setTz(d.settings.site_timezone);
      })
      .catch(() => {});
  }, []);

  // Range to fetch depends on the view.
  const range = (() => {
    if (view === "week") {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    return { start, end };
  })();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/calendar-events?start=${range.start.toISOString()}&end=${range.end.toISOString()}`
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      setEvents(data.events || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()]);

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

  function shift(dir: number) {
    setCursor((c) => {
      const n = new Date(c);
      if (view === "week") n.setDate(n.getDate() + dir * 7);
      else n.setMonth(n.getMonth() + dir);
      return n;
    });
  }

  // Group events by day key.
  const byDay = new Map<string, CalEvent[]>();
  for (const e of events) {
    const key = dayKey(e.start, tz);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }
  Array.from(byDay.values()).forEach((list) =>
    list.sort((a, b) => a.start.localeCompare(b.start))
  );

  const todayKey = dayKey(new Date().toISOString(), tz);

  // Month grid cells.
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weekRows = cells.length / 7;

  // Week days.
  const weekStart = new Date(cursor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const heading =
    view === "week"
      ? `Week of ${weekDays[0].toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} – ${weekDays[6].toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <h1 className="font-display text-2xl font-semibold">Calendar</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Your Google Calendar, inside the console. Click an event to see details
        or edit it, or click a day to add one. Times shown in {tzLabel(tz)}{" "}
        (change it in Studio → Email → Time zone).
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => shift(-1)}
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-52 text-center font-display text-lg font-semibold">
                {heading}
              </span>
              <button
                onClick={() => shift(1)}
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-subtle"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPanel({ mode: "create", day: todayKey })}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                <Plus size={14} /> New event
              </button>
              <div className="flex overflow-hidden rounded-md border border-line text-xs">
                {(["month", "week"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cx(
                      "px-3 py-1.5 capitalize",
                      view === v
                        ? "bg-foreground text-background"
                        : "hover:bg-subtle"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={disconnect}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-500"
              >
                <Unlink size={13} /> Disconnect
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm">
              {error} — you may need to reconnect the calendar.
            </p>
          )}

          {view === "month" ? (
            <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-lg border border-line bg-card">
              <div className="grid grid-cols-7 border-b border-line text-center text-xs uppercase tracking-widest text-muted">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div
                className="grid flex-1 grid-cols-7"
                style={{
                  gridTemplateRows: `repeat(${weekRows}, minmax(6rem, 1fr))`,
                }}
              >
                {cells.map((d, i) => {
                  const key = d ? ymd(d) : "";
                  const dayEvents = key ? byDay.get(key) || [] : [];
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={i}
                      onClick={() =>
                        d && setPanel({ mode: "create", day: key })
                      }
                      className={cx(
                        "flex flex-col overflow-hidden border-b border-r border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                        d && "cursor-pointer hover:bg-subtle/40"
                      )}
                    >
                      {d && (
                        <>
                          <div
                            className={
                              "mb-1 text-xs " +
                              (isToday
                                ? "flex h-5 w-5 items-center justify-center rounded-full bg-foreground font-semibold text-background"
                                : "text-muted")
                            }
                          >
                            {d.getDate()}
                          </div>
                          <div className="flex-1 space-y-1 overflow-y-auto">
                            {dayEvents.map((e) => (
                              <EventChip
                                key={e.id}
                                e={e}
                                tz={tz}
                                onClick={() =>
                                  setPanel({ mode: "view", event: e })
                                }
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-7">
              {weekDays.map((d) => {
                const key = ymd(d);
                const dayEvents = byDay.get(key) || [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className="flex min-h-40 flex-col rounded-lg border border-line bg-card p-2"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted">
                        {WEEKDAYS[d.getDay()]}
                      </span>
                      <button
                        onClick={() => setPanel({ mode: "create", day: key })}
                        className={
                          "text-xs " +
                          (isToday
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-foreground font-semibold text-background"
                            : "text-muted hover:text-foreground")
                        }
                        title="Add event"
                      >
                        {d.getDate()}
                      </button>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {dayEvents.length === 0 && (
                        <button
                          onClick={() =>
                            setPanel({ mode: "create", day: key })
                          }
                          className="w-full rounded border border-dashed border-line py-2 text-[11px] text-muted/60 hover:border-foreground hover:text-foreground"
                        >
                          + add
                        </button>
                      )}
                      {dayEvents.map((e) => (
                        <EventChip
                          key={e.id}
                          e={e}
                          tz={tz}
                          block
                          onClick={() => setPanel({ mode: "view", event: e })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loading && <p className="mt-3 text-sm text-muted">Loading events…</p>}
        </>
      )}

      {panel && (
        <EventPanel
          panel={panel}
          tz={tz}
          onClose={() => setPanel(null)}
          onSaved={() => {
            setPanel(null);
            loadEvents();
          }}
          onEdit={(event) => setPanel({ mode: "edit", event })}
        />
      )}
    </div>
  );
}

function EventChip({
  e,
  tz,
  onClick,
  block,
}: {
  e: CalEvent;
  tz: string;
  onClick: () => void;
  block?: boolean;
}) {
  return (
    <button
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      title={`${e.title}${e.location ? ` · ${e.location}` : ""}`}
      className={cx(
        "w-full rounded bg-subtle px-1.5 text-left text-[11px] hover:bg-foreground hover:text-background",
        block ? "py-1" : "truncate py-0.5"
      )}
    >
      {!e.allDay && (
        <span className={block ? "block text-muted" : "text-muted"}>
          {timeIn(e.start, tz)}{" "}
        </span>
      )}
      <span className={block ? "block truncate font-medium" : ""}>
        {e.title}
      </span>
    </button>
  );
}

function EventPanel({
  panel,
  tz,
  onClose,
  onSaved,
  onEdit,
}: {
  panel: PanelState;
  tz: string;
  onClose: () => void;
  onSaved: () => void;
  onEdit: (event: CalEvent) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-line bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {panel.mode === "view"
              ? "Event"
              : panel.mode === "edit"
              ? "Edit event"
              : "New event"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {panel.mode === "view" ? (
          <EventDetails event={panel.event} tz={tz} onEdit={onEdit} onSaved={onSaved} />
        ) : (
          <EventForm
            tz={tz}
            event={panel.mode === "edit" ? panel.event : undefined}
            day={panel.mode === "create" ? panel.day : undefined}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );
}

function EventDetails({
  event,
  tz,
  onEdit,
  onSaved,
}: {
  event: CalEvent;
  tz: string;
  onEdit: (event: CalEvent) => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this event? Attendees will be notified.")) return;
    setBusy(true);
    await fetch(`/api/admin/calendar-events?id=${event.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    onSaved();
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">{event.title}</p>
      <p className="text-muted">
        {event.allDay
          ? `${longDate(event.start, tz)} · All day`
          : `${longDate(event.start, tz)} · ${timeIn(event.start, tz)} – ${timeIn(
              event.end,
              tz
            )}`}
      </p>
      {event.location && (
        <p className="flex items-center gap-1.5 text-muted">
          <MapPin size={14} /> {event.location}
        </p>
      )}
      {event.description && (
        <p className="whitespace-pre-wrap text-muted">{event.description}</p>
      )}
      {event.editable ? (
        <div className="flex items-center gap-3 border-t border-line pt-3">
          <button
            onClick={() => onEdit(event)}
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Edit
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-xs text-muted">
          This event lives on a calendar that can&apos;t be edited from here.
        </p>
      )}
    </div>
  );
}

function EventForm({
  tz,
  event,
  day,
  onSaved,
}: {
  tz: string;
  event?: CalEvent;
  day?: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [location, setLocation] = useState(event?.location || "");
  const [description, setDescription] = useState(event?.description || "");
  const [start, setStart] = useState(
    event
      ? utcToZonedWallTime(event.start, tz)
      : `${day || ymd(new Date())}T10:00`
  );
  const [end, setEnd] = useState(
    event
      ? utcToZonedWallTime(event.end, tz)
      : `${day || ymd(new Date())}T11:00`
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!title.trim()) {
      setErr("Add a title.");
      return;
    }
    const startUtc = zonedWallTimeToUtc(start, tz);
    const endUtc = zonedWallTimeToUtc(end, tz);
    if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime())) {
      setErr("Pick a valid date & time.");
      return;
    }
    if (endUtc.getTime() <= startUtc.getTime()) {
      setErr("End must be after start.");
      return;
    }
    setBusy(true);
    setErr("");
    const body = {
      id: event?.id,
      title,
      location,
      description,
      start: startUtc.toISOString(),
      end: endUtc.toISOString(),
    };
    const res = await fetch("/api/admin/calendar-events", {
      method: event ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Couldn't save.");
      return;
    }
    onSaved();
  }

  const input =
    "mt-1 w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="text-xs font-medium text-muted">Title</span>
        <input
          className={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-muted">Start</span>
          <input
            type="datetime-local"
            className={input}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">End</span>
          <input
            type="datetime-local"
            className={input}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-muted">Times are in {tzLabel(tz)}.</p>
      <label className="block">
        <span className="text-xs font-medium text-muted">Location</span>
        <input
          className={input}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted">Notes</span>
        <textarea
          className={cx(input, "min-h-20 resize-y")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        onClick={save}
        disabled={busy}
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {busy ? "Saving…" : event ? "Save changes" : "Create event"}
      </button>
    </div>
  );
}
