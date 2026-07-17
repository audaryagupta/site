"use client";

import { useState } from "react";
import { Calendar, MapPin, Video } from "lucide-react";
import { cx } from "@/lib/utils";

const MODES = [
  { key: "meet", label: "Google Meet", icon: Video },
  { key: "zoom", label: "Zoom", icon: Video },
  { key: "physical", label: "In person", icon: MapPin },
];

const DURATIONS = [15, 30, 60];

export function AppointmentBooker() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    mode: "meet",
    date: "",
    time: "",
    duration: 30,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="rounded-md border border-line bg-subtle/60 p-6">
        <p className="font-display text-xl">Request received.</p>
        <p className="mt-2 text-sm text-muted">
          Audarya will review your requested time and confirm by email. If
          accepted, you&apos;ll get a calendar invite with the meeting details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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

      <div>
        <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
          Meeting type — online or in person
        </label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                type="button"
                key={m.key}
                onClick={() => update("mode", m.key)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  form.mode === m.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-line hover:bg-subtle"
                )}
              >
                <Icon size={15} /> {m.label}
              </button>
            );
          })}
        </div>
        {form.mode === "physical" && (
          <p className="mt-2 text-xs text-muted">
            Audarya travels often — the exact city/location is confirmed with
            you when the request is accepted.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
            Date
          </label>
          <input
            type="date"
            className={input}
            required
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
            Time
          </label>
          <input
            type="time"
            className={input}
            required
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
            Duration
          </label>
          <select
            className={input}
            value={form.duration}
            onChange={(e) => update("duration", Number(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        className="min-h-24 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground"
        placeholder="What would you like to talk about?"
        value={form.purpose}
        onChange={(e) => update("purpose", e.target.value)}
      />

      {status === "error" && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        <Calendar size={16} />
        {status === "loading" ? "Requesting…" : "Request appointment"}
      </button>
    </form>
  );
}
