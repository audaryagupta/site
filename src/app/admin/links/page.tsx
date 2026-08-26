"use client";

import { useEffect, useState } from "react";
import { Trash2, ExternalLink, GripVertical, Plus } from "lucide-react";
import { LINK_ICON_KEYS, LinkIcon } from "@/lib/linkIcons";
import { UploadButton } from "@/components/admin/UploadButton";
import {
  LINK_TARGET_TYPES,
  buildLinkUrl,
  displayLinkUrl,
  type LinkTargetType,
} from "@/lib/linkTarget";

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: string;
  active: boolean;
  order: number;
}

const input =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

export default function LinksAdminPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [form, setForm] = useState({
    label: "",
    url: "",
    icon: "link",
    type: "website" as LinkTargetType,
  });
  const [saving, setSaving] = useState(false);

  const targetType =
    LINK_TARGET_TYPES.find((t) => t.value === form.type) ||
    LINK_TARGET_TYPES[0];

  // Switching type suggests the matching icon, unless a custom/other icon was
  // already picked deliberately.
  function changeType(next: LinkTargetType) {
    const suggested =
      LINK_TARGET_TYPES.find((t) => t.value === next)?.icon || "link";
    const stillDefault = LINK_TARGET_TYPES.some((t) => t.icon === form.icon);
    setForm((f) => ({
      ...f,
      type: next,
      icon: stillDefault ? suggested : f.icon,
    }));
  }

  async function load() {
    const res = await fetch("/api/admin/links");
    const data = await res.json();
    setLinks(data.links || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.label.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          icon: form.icon,
          url: buildLinkUrl(form.type, form.url),
        }),
      });
      setForm({ label: "", url: "", icon: "link", type: "website" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, patch: Partial<LinkItem>) {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await fetch("/api/admin/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this link?")) return;
    await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= links.length) return;
    const a = links[index];
    const b = links[j];
    await Promise.all([
      patch(a.id, { order: b.order }),
      patch(b.id, { order: a.order }),
    ]);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Link hub</h1>
          <p className="mt-1 text-sm text-muted">
            Your standalone links page (linktree-style), separate from the main
            site.{" "}
            <a
              href="/qr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              View it <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <h2 className="text-sm font-semibold">Add a link</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Label (e.g. My Instagram, Call me)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
          <select
            className={input}
            value={form.type}
            onChange={(e) => changeType(e.target.value as LinkTargetType)}
          >
            {LINK_TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className={`${input} sm:col-span-2`}
            type={
              form.type === "phone" || form.type === "whatsapp"
                ? "tel"
                : form.type === "email"
                  ? "email"
                  : "text"
            }
            placeholder={targetType.placeholder}
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {form.type === "phone"
            ? "Visitors tap to call. Include the country code (e.g. +91)."
            : form.type === "whatsapp"
              ? "Opens a WhatsApp chat with you. Include the country code (e.g. +91)."
              : form.type === "email"
                ? "Visitors tap to open a new email to you."
                : "Any web address — https:// is added automatically if you leave it out."}
        </p>

        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted">
            Icon
          </p>
          <div className="flex flex-wrap gap-2">
            {LINK_ICON_KEYS.map((ic) => (
              <button
                key={ic.key}
                title={ic.label}
                onClick={() => setForm((f) => ({ ...f, icon: ic.key }))}
                className={
                  "flex h-10 w-10 items-center justify-center rounded-md border transition " +
                  (form.icon === ic.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-line hover:bg-subtle")
                }
              >
                <LinkIcon icon={ic.key} size={20} />
              </button>
            ))}
            {/* Custom uploaded icon preview */}
            {form.icon.startsWith("/") || form.icon.startsWith("http") ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-foreground bg-foreground text-background">
                <LinkIcon icon={form.icon} size={20} />
              </span>
            ) : null}
          </div>
          <div className="mt-3">
            <UploadButton
              kind="icon"
              accept="image/*"
              label="Upload custom icon"
              onDone={(url) => setForm((f) => ({ ...f, icon: url }))}
            />
            <span className="ml-2 text-xs text-muted">
              PNG/SVG, square works best.
            </span>
          </div>
        </div>

        <button
          onClick={add}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          <Plus size={15} /> {saving ? "Adding…" : "Add link"}
        </button>
      </div>

      {/* Existing links */}
      <div className="mt-6 space-y-2">
        {links.map((l, i) => (
          <div
            key={l.id}
            className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3"
          >
            <div className="flex flex-col text-muted">
              <button onClick={() => move(i, -1)} className="hover:text-foreground" aria-label="Move up">
                ▲
              </button>
              <button onClick={() => move(i, 1)} className="hover:text-foreground" aria-label="Move down">
                ▼
              </button>
            </div>
            <GripVertical size={16} className="text-muted" />
            <span className="flex h-9 w-9 flex-none items-center justify-center">
              <LinkIcon icon={l.icon} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <input
                className="w-full bg-transparent text-sm font-medium outline-none"
                value={l.label}
                onChange={(e) =>
                  setLinks((ls) =>
                    ls.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x))
                  )
                }
                onBlur={(e) => patch(l.id, { label: e.target.value })}
              />
              <input
                className="w-full truncate bg-transparent text-xs text-muted outline-none"
                title={l.url}
                value={displayLinkUrl(l.url)}
                onChange={(e) =>
                  setLinks((ls) =>
                    ls.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x))
                  )
                }
                onBlur={(e) => patch(l.id, { url: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-1 text-xs text-muted">
              <input
                type="checkbox"
                checked={l.active}
                onChange={(e) => patch(l.id, { active: e.target.checked })}
              />
              Live
            </label>
            <button
              onClick={() => remove(l.id)}
              className="text-muted hover:text-red-500"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="rounded-lg border border-dashed border-line bg-card p-6 text-center text-sm text-muted">
            No links yet — add your first above.
          </p>
        )}
      </div>
    </div>
  );
}
