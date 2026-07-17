"use client";

import { useEffect, useState } from "react";

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
