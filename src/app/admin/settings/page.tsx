"use client";

import { useEffect, useState } from "react";
import { Ban, Trash2 } from "lucide-react";

interface BlacklistEntry {
  id: string;
  email: string;
  reason: string;
  createdAt: string;
}

function EmailDelivery({
  paused,
  onTogglePaused,
}: {
  paused: boolean;
  onTogglePaused: (v: boolean) => void;
}) {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const res = await fetch("/api/admin/blacklist");
    const data = await res.json();
    setEntries(data.entries || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reason }),
    });
    if (res.ok) {
      setEmail("");
      setReason("");
      load();
    }
  }
  async function remove(id: string) {
    await fetch(`/api/admin/blacklist?id=${id}`, { method: "DELETE" });
    load();
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-xl font-semibold">Email delivery</h2>

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-card p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={paused}
          onChange={(e) => onTogglePaused(e.target.checked)}
        />
        <span className="text-sm">
          <span className="font-medium">Pause all outgoing emails</span>
          <span className="mt-0.5 block text-muted">
            Newsletters and new-article notifications won’t send while paused.
            Test-to-me sends still work. Remember to hit “Save settings”.
          </span>
        </span>
      </label>

      <div className="mt-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Ban size={15} /> Blacklisted addresses
        </p>
        <p className="mt-1 text-xs text-muted">
          Blocked from all mailings and can’t rejoin the list.
        </p>
        <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${input} max-w-64 flex-1`}
            placeholder="email@example.com"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${input} max-w-48 flex-1`}
            placeholder="Reason (optional)"
          />
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            Block
          </button>
        </form>
        <div className="mt-3 divide-y divide-line rounded-lg border border-line">
          {entries.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span>
                {b.email}
                {b.reason && (
                  <span className="ml-2 text-xs text-muted">({b.reason})</span>
                )}
              </span>
              <button
                onClick={() => remove(b.id)}
                className="rounded-md border border-line p-1.5 text-muted hover:bg-subtle"
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="px-3 py-3 text-center text-xs text-muted">
              No blocked addresses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const FIELDS: { key: string; label: string; textarea?: boolean; hint?: string }[] =
  [
    { key: "about_title", label: "About — heading" },
    { key: "about_role", label: "About — role / one-liner" },
    {
      key: "about_bio",
      label: "About — biography",
      textarea: true,
      hint: "Supports plain paragraphs.",
    },
    { key: "about_image", label: "About — portrait image URL" },
    { key: "home_hero_image", label: "Home — hero image URL" },
    {
      key: "home_intro",
      label: "Home — intro line",
      textarea: true,
    },
    { key: "contact_intro", label: "Contact — intro", textarea: true },
  ];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setValues(d.settings || {}));
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setSaving(false);
    setMsg("Saved.");
    setTimeout(() => setMsg(""), 2500);
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Content and image slots across the site. Your logo lives in{" "}
        <code>/public/logo.png</code>.
      </p>

      <div className="mt-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
              {f.label}
            </label>
            {f.textarea ? (
              <textarea
                className={`${input} min-h-24`}
                value={values[f.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            ) : (
              <input
                className={input}
                value={values[f.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            )}
            {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>

      <EmailDelivery
        paused={values.emails_paused === "true"}
        onTogglePaused={(v) =>
          setValues({ ...values, emails_paused: v ? "true" : "false" })
        }
      />

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
