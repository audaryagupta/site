"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// A small, curated timezone list + whatever the browser reports, so the owner
// can schedule in a familiar local zone. IST is the default per house style.
const COMMON_TZS = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

function label12h(time: string): string {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function RecapSchedule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [dow, setDow] = useState(5);
  const [time, setTime] = useState("08:00");
  const [tz, setTz] = useState("Asia/Kolkata");

  const browserTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";

  const tzOptions = Array.from(
    new Set([tz, ...(browserTz ? [browserTz] : []), ...COMMON_TZS])
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        const s = (data.settings || {}) as Record<string, string>;
        setEnabled(s.recap_schedule_enabled === "1");
        const d = parseInt(s.recap_schedule_dow ?? "", 10);
        if (Number.isInteger(d) && d >= 0 && d <= 6) setDow(d);
        if (/^\d{1,2}:\d{2}$/.test(s.recap_schedule_time || "")) {
          const [hh, mm] = s.recap_schedule_time.split(":");
          setTime(`${hh.padStart(2, "0")}:${mm}`);
        }
        if (s.recap_schedule_tz) setTz(s.recap_schedule_tz);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            recap_schedule_enabled: enabled ? "1" : "0",
            recap_schedule_dow: String(dow),
            recap_schedule_time: time,
            recap_schedule_tz: tz,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mb-6 rounded-lg border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock size={16} className="text-muted" />
        <h2 className="font-medium">Auto-schedule the Weekly Recap</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        When on, a recap draft is generated automatically each week at your
        chosen local time and emailed to you for review — nothing is sent to
        subscribers without your approval.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          Enabled
        </label>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
          Day
          <select
            value={dow}
            onChange={(e) => setDow(parseInt(e.target.value, 10))}
            disabled={!enabled}
            className="rounded-md border border-line bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
          Time (local)
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!enabled}
            className="rounded-md border border-line bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
          Timezone
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            disabled={!enabled}
            className="rounded-md border border-line bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
          >
            {tzOptions.map((z) => (
              <option key={z} value={z}>
                {z === browserTz ? `${z} (your timezone)` : z}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <Check size={15} />
          ) : null}
          {saved ? "Saved" : "Save schedule"}
        </button>
      </div>

      {enabled && (
        <p className="mt-3 text-sm text-muted">
          Next drafts every <strong>{DAYS[dow]}</strong> at{" "}
          <strong>{label12h(time)}</strong> ({tz}).
        </p>
      )}
    </div>
  );
}
