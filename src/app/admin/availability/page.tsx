"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cx } from "@/lib/utils";

interface Window {
  id: string;
  status: string;
  kind: string;
  city: string;
  dayOfWeek: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  note: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = [1, 2, 3, 4, 5];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const empty = {
  status: "available" as "available" | "unavailable",
  kind: "online" as "online" | "offline",
  city: "",
  startTime: "10:00",
  endTime: "18:00",
  timezone: "Asia/Kolkata",
  note: "",
};

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AvailabilityPage() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [mode, setMode] = useState<"weekly" | "range">("weekly");
  const [days, setDays] = useState<number[]>([1]);
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/availability");
    const data = await res.json();
    setWindows(data.windows || []);
  }
  useEffect(() => {
    load();
  }, []);

  function toggleDay(d: number) {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "weekly" && days.length === 0) return;
    if (mode === "range" && !range.startDate) return;
    setBusy(true);
    const body =
      mode === "range"
        ? {
            ...form,
            startDate: range.startDate,
            endDate: range.endDate || range.startDate,
          }
        : { ...form, days };
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setForm({ ...empty });
    setDays([1]);
    setRange({ startDate: "", endDate: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    load();
  }

  const input =
    "h-10 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  const weekly = windows.filter((w) => !w.startDate);
  const special = windows.filter((w) => w.startDate);
  const weeklyAvailable = weekly.filter((w) => w.status !== "unavailable");
  const weeklyUnavailable = weekly.filter((w) => w.status === "unavailable");
  const specialAvailable = special.filter((w) => w.status !== "unavailable");
  const specialUnavailable = special.filter((w) => w.status === "unavailable");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Availability</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Set your <strong>weekly default</strong> hours, then layer{" "}
        <strong>special date ranges</strong> on top — e.g. different hours for a
        busy week, or block off travel/holidays. For any date a special range
        covers, it overrides the weekly default. Offline windows show the city
        so visitors know where you are. Calendar out-of-office and busy blocks
        are still respected when a request is accepted.
      </p>

      <form
        onSubmit={add}
        className="mt-6 space-y-4 rounded-lg border border-line bg-card p-4"
      >
        <div className="inline-flex rounded-md border border-line p-0.5 text-sm">
          {(
            [
              ["weekly", "Weekly default"],
              ["range", "Special date range"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cx(
                "rounded px-3 py-1.5 transition",
                mode === key
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
              Status
            </span>
            <select
              className={`${input} w-full`}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "available" | "unavailable",
                }))
              }
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable (blocked)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
              Type
            </span>
            <select
              className={`${input} w-full`}
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as "online" | "offline",
                }))
              }
            >
              <option value="online">Online</option>
              <option value="offline">In person</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
              From
            </span>
            <input
              type="time"
              className={`${input} w-full`}
              value={form.startTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, startTime: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
              To
            </span>
            <input
              type="time"
              className={`${input} w-full`}
              value={form.endTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, endTime: e.target.value }))
              }
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
              City (in-person)
            </span>
            <input
              className={`${input} w-full`}
              placeholder="e.g. Boston, MA"
              value={form.city}
              disabled={form.kind === "online"}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </label>
        </div>

        {mode === "weekly" ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted">
                Repeat on
              </span>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  className="text-muted underline hover:text-foreground"
                  onClick={() => setDays([...WEEKDAYS])}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  className="text-muted underline hover:text-foreground"
                  onClick={() => setDays([...ALL_DAYS])}
                >
                  Every day
                </button>
                <button
                  type="button"
                  className="text-muted underline hover:text-foreground"
                  onClick={() => setDays([])}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => {
                const on = days.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cx(
                      "h-9 w-12 rounded-md border text-sm transition",
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-line text-muted hover:border-foreground hover:text-foreground"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                Start date
              </span>
              <input
                type="date"
                className={`${input} w-full`}
                value={range.startDate}
                onChange={(e) =>
                  setRange((r) => ({ ...r, startDate: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                End date (blank = same day)
              </span>
              <input
                type="date"
                className={`${input} w-full`}
                min={range.startDate || undefined}
                value={range.endDate}
                onChange={(e) =>
                  setRange((r) => ({ ...r, endDate: e.target.value }))
                }
              />
            </label>
            <p className="text-xs text-muted sm:col-span-2">
              Applies these hours to every date in the range, overriding your
              weekly default. Use <strong>Unavailable</strong> to block off
              travel or holidays.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            busy ||
            (mode === "weekly" ? days.length === 0 : !range.startDate)
          }
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm text-background disabled:opacity-50"
        >
          <Plus size={15} />
          {mode === "range"
            ? "Add special window"
            : days.length > 1
              ? `Add to ${days.length} days`
              : "Add window"}
        </button>
      </form>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Weekly default
          </h2>
          <div className="mt-3 space-y-6">
            <WindowGroup
              title="Available"
              rows={weeklyAvailable}
              onRemove={remove}
            />
            <WindowGroup
              title="Unavailable (blocked)"
              rows={weeklyUnavailable}
              onRemove={remove}
              blocked
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            Special date ranges
          </h2>
          <div className="mt-3 space-y-6">
            <WindowGroup
              title="Available"
              rows={specialAvailable}
              onRemove={remove}
              range
            />
            <WindowGroup
              title="Unavailable (blocked)"
              rows={specialUnavailable}
              onRemove={remove}
              blocked
              range
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WindowGroup({
  title,
  rows,
  onRemove,
  blocked,
  range,
}: {
  title: string;
  rows: Window[];
  onRemove: (id: string) => void;
  blocked?: boolean;
  range?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm"
            >
              <div>
                <span
                  className={cx(
                    "rounded-full px-2 py-0.5 text-xs uppercase tracking-wide",
                    blocked
                      ? "bg-red-500/10 text-red-600"
                      : "bg-subtle text-muted"
                  )}
                >
                  {w.kind === "offline" ? "In person" : "Online"}
                </span>{" "}
                <strong>
                  {range
                    ? w.endDate && w.endDate !== w.startDate
                      ? `${fmtDate(w.startDate)} – ${fmtDate(w.endDate)}`
                      : fmtDate(w.startDate)
                    : DAYS[w.dayOfWeek]}
                </strong>{" "}
                {w.startTime}–{w.endTime}{" "}
                <span className="text-muted">({w.timezone})</span>
                {w.city && <span className="text-muted"> · {w.city}</span>}
              </div>
              <button
                onClick={() => onRemove(w.id)}
                className="text-muted hover:text-red-500"
                aria-label="Delete window"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
