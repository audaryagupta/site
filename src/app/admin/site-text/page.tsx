"use client";

import { useEffect, useState } from "react";
import { SITE_TEXT_GROUPS, SITE_TEXT_FIELDS } from "@/lib/siteText";

type TextValue = { text?: string; scale?: number };

export default function SiteTextPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [scales, setScales] = useState<Record<string, number | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const editingField = editing
    ? SITE_TEXT_FIELDS.find((f) => f.id === editing)
    : undefined;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-content");
      const data = await res.json();
      const content: Record<string, TextValue> = data?.content || {};
      const next: Record<string, string> = {};
      const nextScales: Record<string, number | undefined> = {};
      for (const f of SITE_TEXT_FIELDS) {
        const saved = content[f.id];
        next[f.id] = typeof saved?.text === "string" ? saved.text : f.default;
        nextScales[f.id] = saved?.scale;
      }
      setValues(next);
      setScales(nextScales);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const edits = SITE_TEXT_FIELDS.map((f) => ({
        id: f.id,
        value: { text: values[f.id] ?? f.default, scale: scales[f.id] ?? 1 },
      }));
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });
      setMsg(res.ok ? "Saved — changes are live on the site." : "Save failed.");
    } catch {
      setMsg("Save failed.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 4000);
    }
  }

  function reset(id: string, def: string) {
    setValues((v) => ({ ...v, [id]: def }));
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold">Site text</h1>
      <p className="mt-1 text-sm text-muted">
        Edit the wording shown across the public site — headlines, taglines and
        other copy. Saved changes go live immediately.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-6 space-y-6">
            {SITE_TEXT_GROUPS.map((g) => (
              <section
                key={g.label}
                className="rounded-lg border border-line bg-card p-4"
              >
                <h2 className="text-sm font-semibold">{g.label}</h2>
                {g.description && (
                  <p className="mt-0.5 text-xs text-muted">{g.description}</p>
                )}
                <div className="mt-4 space-y-4">
                  {g.fields.map((f) => (
                    <div key={f.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-widest text-muted">
                          {f.label}
                        </label>
                        {values[f.id] !== f.default && (
                          <button
                            type="button"
                            onClick={() => reset(f.id, f.default)}
                            className="text-xs text-muted underline hover:text-foreground"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      {f.longform ? (
                        <div className="rounded-md border border-line bg-background p-3">
                          <p className="line-clamp-3 whitespace-pre-line text-sm text-muted">
                            {values[f.id] || f.default}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditing(f.id)}
                            className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-subtle"
                          >
                            Open editor
                          </button>
                        </div>
                      ) : f.multiline ? (
                        <textarea
                          className={`${input} min-h-20`}
                          value={values[f.id] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [f.id]: e.target.value }))
                          }
                        />
                      ) : (
                        <input
                          className={input}
                          value={values[f.id] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [f.id]: e.target.value }))
                          }
                        />
                      )}
                      {f.help && (
                        <p className="mt-1 text-xs text-muted">{f.help}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="sticky bottom-0 mt-6 flex items-center gap-3 border-t border-line bg-background/90 py-4 backdrop-blur">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-foreground px-5 py-2 text-sm text-background disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {msg && <span className="text-sm text-muted">{msg}</span>}
          </div>
        </>
      )}

      {editingField && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {editingField.label}
                </h2>
                {editingField.help && (
                  <p className="mt-0.5 text-xs text-muted">{editingField.help}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      [editingField.id]: editingField.default,
                    }))
                  }
                  className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-subtle"
                >
                  Reset to default
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-subtle"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await save();
                    setEditing(null);
                  }}
                  disabled={saving}
                  className="rounded-md bg-foreground px-4 py-1.5 text-xs text-background disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save & close"}
                </button>
              </div>
            </div>
            <textarea
              autoFocus
              className="mt-4 h-full w-full flex-1 resize-none rounded-md border border-line bg-card p-4 font-mono text-sm leading-relaxed outline-none focus:border-foreground"
              value={values[editingField.id] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [editingField.id]: e.target.value }))
              }
            />
            <p className="mt-2 text-xs text-muted">
              Leave a blank line between paragraphs. Your spacing and line breaks
              are preserved on the page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
