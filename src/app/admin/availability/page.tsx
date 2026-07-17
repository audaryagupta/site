"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Window {
  id: string;
  kind: string;
  city: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  note: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const empty = {
  kind: "online" as "online" | "offline",
  city: "",
  dayOfWeek: 1,
  startTime: "10:00",
  endTime: "18:00",
  timezone: "Asia/Kolkata",
  note: "",
};

export default function AvailabilityPage() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/availability");
    const data = await res.json();
    setWindows(data.windows || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dayOfWeek: Number(form.dayOfWeek) }),
    });
    setBusy(false);
    setForm({ ...empty });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    load();
  }

  const input =
    "h-10 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Availability</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Publish recurring windows for online and in-person bookings. Offline
        windows show the city so visitors know where you are. Calendar
        out-of-office and busy blocks are still respected when a request is
        accepted.
      </p>

      <form
        onSubmit={add}
        className="mt-6 grid items-end gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-6"
      >
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
            Day
          </span>
          <select
            className={`${input} w-full`}
            value={form.dayOfWeek}
            onChange={(e) =>
              setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))
            }
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
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
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm text-background disabled:opacity-50 sm:col-span-2"
        >
          <Plus size={15} /> Add window
        </button>
      </form>

      <div className="mt-8 space-y-2">
        {windows.length === 0 ? (
          <p className="text-sm text-muted">No availability windows yet.</p>
        ) : (
          windows.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm"
            >
              <div>
                <span className="rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                  {w.kind === "offline" ? "In person" : "Online"}
                </span>{" "}
                <strong>{DAYS[w.dayOfWeek]}</strong> {w.startTime}–{w.endTime}{" "}
                <span className="text-muted">({w.timezone})</span>
                {w.city && <span className="text-muted"> · {w.city}</span>}
              </div>
              <button
                onClick={() => remove(w.id)}
                className="text-muted hover:text-red-500"
                aria-label="Delete window"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
