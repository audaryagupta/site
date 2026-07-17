"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Rocket, Undo2 } from "lucide-react";

const CHECKLIST = [
  "Bio, portrait and home images set in Settings",
  "At least a few writings published",
  "Availability posted and calendar sync configured",
  "Sender address + credentials wired for email",
  "byaudarya.com DNS pointed at this app",
];

export default function LaunchPage() {
  const [live, setLive] = useState(false);
  const [launchAt, setLaunchAt] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const primaryHost =
    process.env.NEXT_PUBLIC_PRIMARY_HOST || "your main domain";

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setLive(d.settings?.site_live === "true");
        setLaunchAt(d.settings?.launch_at || "");
        setLoaded(true);
      });
  }, []);

  async function save(settings: Record<string, string>) {
    setBusy(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setBusy(false);
  }

  async function goLive() {
    if (
      !confirm(
        `Go live? ${primaryHost} will immediately switch from the teaser to the full site.`
      )
    )
      return;
    await save({ site_live: "true" });
    setLive(true);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 4000);
  }

  async function revert() {
    if (!confirm("Take the main domain back to the teaser page?")) return;
    await save({ site_live: "" });
    setLive(false);
  }

  async function saveDate() {
    await save({ launch_at: launchAt });
  }

  return (
    <div className="max-w-2xl">
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="absolute block h-2 w-2 rounded-sm"
              style={{
                left: `${(i * 37) % 100}%`,
                top: "-10px",
                background: i % 2 ? "#000" : "#888",
                animation: `confetti-fall ${2 + (i % 5) * 0.4}s linear ${
                  (i % 10) * 0.15
                }s forwards`,
              }}
            />
          ))}
        </div>
      )}
      <style jsx global>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(110vh) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex items-center gap-2">
        <Rocket size={22} />
        <h1 className="font-display text-2xl font-semibold">Launch</h1>
      </div>
      <p className="mt-1 text-sm text-muted">
        A one-time switch for going live on your main domain. Until you launch,{" "}
        <code>{primaryHost}</code> shows a teaser; everywhere else (this console
        and any preview URL) shows the full site.
      </p>

      {!loaded ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : (
        <>
          <div
            className={`mt-6 rounded-lg border p-6 ${
              live
                ? "border-foreground bg-foreground text-background"
                : "border-line bg-card"
            }`}
          >
            <p className="text-xs uppercase tracking-widest opacity-70">
              Current status
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {live ? "Live — the full site is public" : "Not launched yet"}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {live
                ? `${primaryHost} is serving the real site.`
                : `${primaryHost} is showing the coming-soon teaser.`}
            </p>

            <div className="mt-5">
              {live ? (
                <button
                  onClick={revert}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md border border-background/40 px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  <Undo2 size={16} /> Revert to teaser
                </button>
              ) : (
                <button
                  onClick={goLive}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
                >
                  <Rocket size={16} /> Go live now
                </button>
              )}
            </div>
          </div>

          {/* Launch countdown date (shown on the teaser) */}
          <div className="mt-6 rounded-lg border border-line bg-card p-5">
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
              Optional launch date (drives the teaser countdown)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="datetime-local"
                value={launchAt}
                onChange={(e) => setLaunchAt(e.target.value)}
                className="h-10 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
              />
              <button
                onClick={saveDate}
                disabled={busy}
                className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
              >
                Save date
              </button>
              {launchAt && (
                <button
                  onClick={() => {
                    setLaunchAt("");
                    save({ launch_at: "" });
                  }}
                  disabled={busy}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Pre-launch checklist */}
          <div className="mt-6 rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">
              Before you launch
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex items-start gap-2 text-muted">
                  {live ? (
                    <CheckCircle2 size={16} className="mt-0.5 text-foreground" />
                  ) : (
                    <Circle size={16} className="mt-0.5" />
                  )}
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              This is a reminder list — launching only flips the public switch.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
