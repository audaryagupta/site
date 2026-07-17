"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Editor } from "./Editor";
import { cx } from "@/lib/utils";

export interface ArticleDraft {
  id?: string;
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string;
  coverImage: string;
  coverCredit: string;
  language: string;
  translationHtml: string;
  translationLang: string;
  tags: string[];
  status: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  notifiedAt?: string | null;
}

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "sa", label: "Sanskrit" },
];

export function ArticleEditor({ initial }: { initial: ArticleDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ArticleDraft>(initial);
  const [tagInput, setTagInput] = useState(initial.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [showTranslation, setShowTranslation] = useState(
    Boolean(initial.translationHtml)
  );
  const [notifiedAt, setNotifiedAt] = useState<string | null>(
    initial.notifiedAt ?? null
  );
  const [notifying, setNotifying] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");

  async function notifySubscribers() {
    if (
      !confirm(
        "Email all active subscribers about this article now? This can only be done once per article."
      )
    )
      return;
    setNotifying(true);
    setNotifyMsg("");
    try {
      const res = await fetch(`/api/admin/articles/${draft.id}/notify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setNotifiedAt(new Date().toISOString());
      setNotifyMsg(`Sent to ${data.sent} subscriber(s).`);
    } catch (e) {
      setNotifyMsg((e as Error).message);
    } finally {
      setNotifying(false);
    }
  }

  function set<K extends keyof ArticleDraft>(k: K, v: ArticleDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function ai(action: string, payload: Record<string, unknown>) {
    setAiBusy(action + (payload.mode ? `:${payload.mode}` : ""));
    setMsg("");
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      return data.result as string;
    } catch (e) {
      setMsg((e as Error).message);
      return null;
    } finally {
      setAiBusy(null);
    }
  }

  async function assist(mode: string) {
    const result = await ai("assist", { mode, content: draft.contentHtml });
    if (result === null) return;
    if (mode === "title") set("title", result.replace(/^["']|["']$/g, ""));
    else if (mode === "excerpt") set("excerpt", result);
    else set("contentHtml", result);
  }

  async function translate() {
    const target = draft.translationLang || "hi";
    const result = await ai("translate", {
      content: draft.contentHtml,
      targetLang: target,
    });
    if (result === null) return;
    set("translationHtml", result);
    set("translationLang", target);
    setShowTranslation(true);
  }

  async function save(status?: string) {
    setSaving(true);
    setMsg("");
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = { ...draft, tags, status: status ?? draft.status };
    try {
      const res = await fetch(
        draft.id ? `/api/admin/articles/${draft.id}` : "/api/admin/articles",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Saved.");
      if (!draft.id && data.article?.id) {
        router.replace(`/admin/writings/${data.article.id}`);
        setDraft((d) => ({ ...d, id: data.article.id, status: data.article.status }));
      } else {
        set("status", data.article.status);
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";
  const aiBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs transition hover:bg-subtle disabled:opacity-50";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
      <div>
        <input
          className="w-full bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-muted"
          placeholder="Title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted">
            <Sparkles size={13} /> AI
          </span>
          {["improve", "shorten", "expand", "continue", "title", "excerpt"].map(
            (m) => (
              <button
                key={m}
                className={aiBtn}
                disabled={!!aiBusy}
                onClick={() => assist(m)}
              >
                {aiBusy === `assist:${m}` ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Wand2 size={12} />
                )}
                {m}
              </button>
            )
          )}
        </div>

        <div className="mt-4">
          <Editor
            value={draft.contentHtml}
            onChange={(html) => set("contentHtml", html)}
            placeholder="Tell the story…"
          />
        </div>

        {/* Translation */}
        <div className="mt-6 rounded-lg border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Translation (optional)</h3>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-line bg-background px-2 py-1 text-xs"
                value={draft.translationLang || "hi"}
                onChange={(e) => set("translationLang", e.target.value)}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                className={aiBtn}
                disabled={!!aiBusy}
                onClick={translate}
              >
                {aiBusy === "translate" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Wand2 size={12} />
                )}
                Auto-translate
              </button>
              <button
                className="text-xs text-muted hover:text-foreground"
                onClick={() => setShowTranslation((v) => !v)}
              >
                {showTranslation ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {showTranslation && (
            <div className="mt-3">
              <Editor
                value={draft.translationHtml}
                onChange={(html) => set("translationHtml", html)}
                placeholder="Translated version…"
              />
              <p className="mt-2 text-xs text-muted">
                Readers can toggle between the original and this translation on
                the article page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <div className="rounded-lg border border-line bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span
              className={cx(
                "rounded-full px-2.5 py-1 text-xs",
                draft.status === "published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-subtle text-muted"
              )}
            >
              {draft.status === "published" ? "Published" : "Draft"}
            </span>
            {msg && <span className="text-xs text-muted">{msg}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => save("draft")}
              disabled={saving}
              className="h-10 rounded-md border border-line text-sm font-medium transition hover:bg-subtle disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              onClick={() => save("published")}
              disabled={saving}
              className="h-10 rounded-md bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {draft.status === "published" ? "Update" : "Publish"}
            </button>
            {draft.id && draft.status === "published" && (
              <a
                href={`/writings/${draft.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-center text-xs text-muted hover:text-foreground"
              >
                View live →
              </a>
            )}
          </div>
        </div>

        {draft.id && draft.status === "published" && (
          <div className="rounded-lg border border-line bg-card p-4">
            <h3 className="text-sm font-medium">Subscriber notification</h3>
            <p className="mt-1 text-xs text-muted">
              Optional. If you don&apos;t notify, this piece still appears on the
              site and can be featured in the Weekly Recap.
            </p>
            {notifiedAt ? (
              <p className="mt-3 text-xs text-muted">
                Subscribers were notified on{" "}
                {new Date(notifiedAt).toLocaleDateString()}.
              </p>
            ) : (
              <button
                onClick={notifySubscribers}
                disabled={notifying}
                className="mt-3 h-10 w-full rounded-md border border-line text-sm font-medium transition hover:bg-subtle disabled:opacity-50"
              >
                {notifying ? "Sending…" : "Notify subscribers"}
              </button>
            )}
            {notifyMsg && (
              <p className="mt-2 text-xs text-muted">{notifyMsg}</p>
            )}
          </div>
        )}

        <Field label="Topics (comma-separated)">
          <input
            className={input}
            placeholder="Finance, Tech"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
        </Field>

        <Field label="Primary language">
          <select
            className={input}
            value={draft.language}
            onChange={(e) => set("language", e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cover image URL">
          <input
            className={input}
            placeholder="https://…"
            value={draft.coverImage}
            onChange={(e) => set("coverImage", e.target.value)}
          />
          {draft.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.coverImage}
              alt=""
              className="mt-2 h-32 w-full rounded-md border border-line object-cover"
            />
          )}
        </Field>

        <Field label="Cover image credit">
          <input
            className={input}
            placeholder="Photo by … / Source"
            value={draft.coverCredit}
            onChange={(e) => set("coverCredit", e.target.value)}
          />
        </Field>

        <Field label="Excerpt">
          <textarea
            className={cx(input, "min-h-20")}
            value={draft.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </Field>

        <Field label="Slug">
          <input
            className={input}
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="auto from title"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          Feature on homepage
        </label>

        <details className="rounded-lg border border-line bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">SEO</summary>
          <div className="mt-3 space-y-3">
            <input
              className={input}
              placeholder="SEO title"
              value={draft.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
            />
            <textarea
              className={cx(input, "min-h-16")}
              placeholder="SEO description"
              value={draft.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
            />
          </div>
        </details>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
