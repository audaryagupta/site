"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { Captcha, type CaptchaValue } from "./Captcha";

type Window = {
  kind: string;
  city: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const MODES = [
  { key: "meet", label: "Google Meet", icon: Video, kind: "online" },
  { key: "zoom", label: "Zoom", icon: Video, kind: "online" },
  { key: "physical", label: "In person", icon: MapPin, kind: "offline" },
] as const;

const DURATIONS = [15, 30, 60];
const STEPS = ["Type", "Time", "Details"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function to12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function AppointmentBooker({
  windows = [],
  variant = "inline",
}: {
  windows?: Window[];
  variant?: "inline" | "page";
}) {
  const isPage = variant === "page";
  const [open, setOpen] = useState(isPage);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    mode: "meet" as (typeof MODES)[number]["key"],
    date: "",
    time: "",
    duration: 30,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaValue>({
    token: "",
    answer: "",
  });
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const kind = MODES.find((m) => m.key === form.mode)?.kind ?? "online";

  // Weekdays (0–6) that have at least one published window for this mode kind.
  const availableWeekdays = useMemo(() => {
    const set = new Set<number>();
    for (const w of windows) if (w.kind === kind) set.add(w.dayOfWeek);
    return set;
  }, [windows, kind]);

  const hasWindows = windows.some((w) => w.kind === kind);

  // The grid of days for the visible month.
  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    return cells;
  }, [month]);

  function daySelectable(d: Date) {
    if (d < today) return false;
    // When there are published windows, only allow matching weekdays.
    if (hasWindows) return availableWeekdays.has(d.getDay());
    return true;
  }

  // Slots for the chosen date, derived from published availability windows
  // that match the selected mode's kind and the date's weekday.
  const slots = useMemo(() => {
    if (!form.date) return [];
    const day = new Date(`${form.date}T00:00:00`).getDay();
    const matching = windows.filter(
      (w) => w.kind === kind && w.dayOfWeek === day
    );
    const out: string[] = [];
    for (const w of matching) {
      for (
        let t = toMinutes(w.startTime);
        t + form.duration <= toMinutes(w.endTime);
        t += form.duration
      ) {
        out.push(toLabel(t));
      }
    }
    return Array.from(new Set(out)).sort();
  }, [form.date, form.duration, kind, windows]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          captchaToken: captcha.token,
          captchaAnswer: captcha.answer,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Could not request appointment");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  const input =
    "h-11 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  if (status === "done") {
    return (
      <div className="rounded-xl border border-line bg-subtle/60 p-6 text-center animate-fade-up">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-foreground">
          <Check size={22} />
        </div>
        <p className="mt-4 font-display text-2xl">Request sent.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          I&apos;ve emailed you a confirmation that your request was received.
          Once I review and accept it, you&apos;ll get a calendar invite with
          the meeting details — and a link to cancel if plans change.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-12 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
      >
        <CalendarCheck size={17} />
        Make an appointment
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>
    );
  }

  return (
    <div
      className={cx(
        isPage ? "" : "rounded-xl border border-line p-5 sm:p-6"
      )}
    >
      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cx(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition",
                i < step
                  ? "border-foreground bg-foreground text-background"
                  : i === step
                    ? "border-foreground"
                    : "border-line text-muted"
              )}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </span>
            <span
              className={cx(
                "uppercase tracking-widest",
                i === step ? "text-foreground" : "text-muted"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-line" />
            )}
          </li>
        ))}
      </ol>

      {/* Step 1 — type */}
      {step === 0 && (
        <div key="step-type" className="animate-fade-up space-y-4">
          <p className="text-sm text-muted">How would you like to meet?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = form.mode === m.key;
              return (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => update("mode", m.key)}
                  className={cx(
                    "flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-sm transition",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-line hover:bg-subtle"
                  )}
                >
                  <Icon size={20} />
                  {m.label}
                </button>
              );
            })}
          </div>
          {form.mode === "physical" && (
            <p className="text-xs text-muted">
              Audarya travels often — the exact city/location is confirmed with
              you when the request is accepted.
            </p>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — time (Calendly-style calendar + slots) */}
      {step === 1 && (
        <div key="step-time" className="animate-fade-up space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
              Meeting length
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    update("duration", d);
                    update("time", "");
                  }}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition",
                    form.duration === d
                      ? "border-foreground bg-foreground text-background"
                      : "border-line hover:bg-subtle"
                  )}
                >
                  <Clock size={14} /> {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
            {/* Month calendar */}
            <div className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-base font-semibold">
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    disabled={
                      month.getFullYear() === today.getFullYear() &&
                      month.getMonth() === today.getMonth()
                    }
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() - 1, 1)
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-line transition hover:bg-subtle disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() + 1, 1)
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-line transition hover:bg-subtle"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthDays.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />;
                  const selectable = daySelectable(d);
                  const selected = form.date === ymd(d);
                  const isToday = ymd(d) === ymd(today);
                  return (
                    <button
                      key={ymd(d)}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        update("date", ymd(d));
                        update("time", "");
                      }}
                      className={cx(
                        "relative flex h-9 items-center justify-center rounded-md text-sm transition",
                        selected
                          ? "bg-foreground font-semibold text-background"
                          : selectable
                            ? "hover:bg-subtle"
                            : "cursor-default text-muted/30",
                        isToday && !selected ? "ring-1 ring-line" : ""
                      )}
                    >
                      {d.getDate()}
                      {selectable && !selected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-foreground/50" />
                      )}
                    </button>
                  );
                })}
              </div>
              {hasWindows && (
                <p className="mt-3 text-xs text-muted">
                  Dotted days have open{" "}
                  {kind === "online" ? "online" : "in-person"} windows.
                </p>
              )}
            </div>

            {/* Times for the selected day */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
                {form.date
                  ? new Date(`${form.date}T00:00:00`).toLocaleDateString(
                      "en-US",
                      { weekday: "long", month: "long", day: "numeric" }
                    )
                  : "Select a day"}
              </label>
              {!form.date ? (
                <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                  Pick a date to see available times.
                </p>
              ) : slots.length > 0 ? (
                <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => update("time", s)}
                      className={cx(
                        "rounded-md border px-3 py-2.5 text-sm transition",
                        form.time === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-line hover:border-foreground"
                      )}
                    >
                      {to12h(s)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="time"
                    className={input}
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                  />
                  <p className="text-xs text-muted">
                    No set window that day — pick any time and I&apos;ll confirm
                    from my calendar.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-5 text-sm transition hover:bg-subtle"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              disabled={!form.date || !form.time}
              onClick={() => setStep(2)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — details */}
      {step === 2 && (
        <form key="step-details" onSubmit={submit} className="animate-fade-up space-y-4">
          <div className="rounded-md border border-line bg-subtle/50 px-4 py-3 text-sm">
            <span className="text-muted">Requesting:</span>{" "}
            <strong>
              {MODES.find((m) => m.key === form.mode)?.label}
            </strong>{" "}
            ·{" "}
            {form.date
              ? new Date(`${form.date}T00:00:00`).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : ""}{" "}
            at {form.time ? to12h(form.time) : ""} · {form.duration} min
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className={input}
              placeholder="Name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <input
              className={input}
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <input
            className={input}
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <textarea
            className="min-h-24 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground"
            placeholder="What would you like to talk about?"
            required
            value={form.purpose}
            onChange={(e) => update("purpose", e.target.value)}
          />

          <Captcha onChange={setCaptcha} />

          {status === "error" && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-5 text-sm transition hover:bg-subtle"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              disabled={status === "loading" || !captcha.token}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              <CalendarCheck size={16} />
              {status === "loading" ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
