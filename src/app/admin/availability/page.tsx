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

export default function AvailabilityPage() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [days, setDays] = useState<number[]>([1]);
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
    if (days.length === 0) return;
    setBusy(true);
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, days }),
    });
    setBusy(false);
    setForm({ ...empty });
    setDays([1]);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    load();
  }

  const input =
    "h-10 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  const available = windows.filter((w) => w.status !== "unavailable");
  const unavailable = windows.filter((w) => w.status === "unavailable");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Availability</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Publish recurring windows when you&apos;re available for bookings — or
        block off unavailable time. Pick several weekdays to add the same window
        to all of them at once. Offline windows show the city so visitors know
        where you are. Calendar out-of-office and busy blocks are still
        respected when a request is accepted.
      </p>

      <form
        onSubmit={add}
        className="mt-6 space-y-4 rounded-lg border border-line bg-card p-4"
      >
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

        <button
          type="submit"
          disabled={busy || days.length === 0}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm text-background disabled:opacity-50"
        >
          <Plus size={15} />
          {days.length > 1
            ? `Add to ${days.length} days`
            : "Add window"}
        </button>
      </form>

      <div className="mt-8 space-y-6">
        <WindowGroup
          title="Available"
          rows={available}
          onRemove={remove}
        />
        <WindowGroup
          title="Unavailable (blocked)"
          rows={unavailable}
          onRemove={remove}
          blocked
        />
      </div>
    </div>
  );
}

function WindowGroup({
  title,
  rows,
  onRemove,
  blocked,
}: {
  title: string;
  rows: Window[];
  onRemove: (id: string) => void;
  blocked?: boolean;
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
                <strong>{DAYS[w.dayOfWeek]}</strong> {w.startTime}–{w.endTime}{" "}
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
