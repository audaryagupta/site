"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, Send, TestTube2, Trash2 } from "lucide-react";
import { Editor } from "./Editor";
import { cx } from "@/lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

interface Story {
  rank: number;
  title: string;
  summary: string;
  category: string;
  region: string;
  source?: string;
  url?: string;
  imageUrl?: string;
}
interface Featured {
  title: string;
  blurb?: string;
  url?: string;
  imageUrl?: string;
}
interface RecapData {
  intro: string;
  signoff?: string;
  stories: Story[];
  featured?: Featured[];
  note?: string;
}
interface PublishedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  status: string;
}

export interface NLData {
  id: string;
  type: string;
  subject: string;
  previewText: string;
  contentHtml: string;
  dataJson: string | null;
  status: string;
  audience: string;
  recipientCount: number;
}

export function NewsletterEditor({ initial }: { initial: NLData }) {
  const router = useRouter();
  const [nl, setNl] = useState<NLData>(initial);
  const [recap, setRecap] = useState<RecapData | null>(
    initial.dataJson ? (JSON.parse(initial.dataJson) as RecapData) : null
  );
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const isRecap = nl.type === "recap" && recap;

  function setStory(i: number, patch: Partial<Story>) {
    if (!recap) return;
    const stories = recap.stories.map((s, idx) =>
      idx === i ? { ...s, ...patch } : s
    );
    setRecap({ ...recap, stories });
  }

  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  useEffect(() => {
    if (nl.type !== "recap") return;
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((d) =>
        setArticles(
          (d.articles || []).filter(
            (a: PublishedArticle) => a.status === "published"
          )
        )
      )
      .catch(() => {});
  }, [nl.type]);

  function setFeatured(next: Featured[]) {
    if (!recap) return;
    setRecap({ ...recap, featured: next });
  }
  function addFeaturedFromArticle(id: string) {
    if (!recap || !id) return;
    const a = articles.find((x) => x.id === id);
    if (!a) return;
    const item: Featured = {
      title: a.title,
      blurb: a.excerpt,
      url: SITE ? `${SITE}/writings/${a.slug}` : `/writings/${a.slug}`,
      imageUrl: a.coverImage || "",
    };
    setFeatured([...(recap.featured || []), item]);
  }

  const previewDoc = useMemo(() => nl.contentHtml, [nl.contentHtml]);

  async function save(extra?: Partial<NLData>) {
    setSaving(true);
    setMsg("");
    const body: Record<string, unknown> = {
      subject: nl.subject,
      previewText: nl.previewText,
      audience: nl.audience,
      ...extra,
    };
    if (isRecap && recap) body.dataJson = JSON.stringify(recap);
    else body.contentHtml = nl.contentHtml;

    try {
      const res = await fetch(`/api/admin/newsletters/${nl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setNl((n) => ({ ...n, ...data.newsletter }));
      setMsg("Saved.");
      router.refresh();
      return true;
    } catch (e) {
      setMsg((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    await save({ status: "approved" });
  }

  async function unapprove() {
    await save({ status: "draft" });
  }

  async function send(test: boolean) {
    setAction(test ? "test" : "send");
    setMsg("");
    if (!test) {
      if (
        !confirm(
          `Send this to all ${nl.audience}? This cannot be undone.`
        )
      ) {
        setAction(null);
        return;
      }
    }
    try {
      // ensure latest content saved first
      await save();
      const res = await fetch(`/api/admin/newsletters/${nl.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      if (test) setMsg("Test sent to your inbox.");
      else {
        setMsg(`Sent to ${data.sent} recipient(s).`);
        setNl((n) => ({ ...n, status: "sent" }));
      }
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setAction(null);
    }
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {nl.type === "recap" ? "Weekly Recap" : `${nl.type} email`}
          </h1>
          <StatusPill status={nl.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className="text-sm text-muted">{msg}</span>}
          <button
            onClick={() => save()}
            disabled={saving}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => send(true)}
            disabled={!!action}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
          >
            {action === "test" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <TestTube2 size={14} />
            )}
            Test to me
          </button>
          {nl.status !== "approved" && nl.status !== "sent" && (
            <button
              onClick={approve}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Approve
            </button>
          )}
          {nl.status === "approved" && (
            <>
              <button
                onClick={unapprove}
                className="rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle"
              >
                Unapprove
              </button>
              <button
                onClick={() => send(false)}
                disabled={!!action}
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {action === "send" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send now
              </button>
            </>
          )}
        </div>
      </div>

      {nl.status === "sent" && (
        <p className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          This newsletter was sent to {nl.recipientCount} recipient(s).
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: editor */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
              Subject
            </label>
            <input
              className={input}
              value={nl.subject}
              onChange={(e) => setNl({ ...nl, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
              Audience
            </label>
            <select
              className={input}
              value={nl.audience}
              onChange={(e) => setNl({ ...nl, audience: e.target.value })}
            >
              <option value="subscribers">Newsletter subscribers</option>
              <option value="contacts">Private contacts</option>
            </select>
          </div>

          {isRecap && recap ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
                  Intro
                </label>
                <textarea
                  className={cx(input, "min-h-20")}
                  value={recap.intro}
                  onChange={(e) => setRecap({ ...recap, intro: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
                  Personal message (optional)
                </label>
                <textarea
                  className={cx(input, "min-h-20")}
                  value={recap.note || ""}
                  onChange={(e) => setRecap({ ...recap, note: e.target.value })}
                  placeholder="A note to readers this week — shown in a highlighted box near the top."
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-widest text-muted">
                    Your featured writing
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      className={cx(input, "max-w-56 py-1.5 text-xs")}
                      value=""
                      onChange={(e) => {
                        addFeaturedFromArticle(e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="">＋ Add from your writings…</option>
                      {articles.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatured([
                          ...(recap.featured || []),
                          { title: "", blurb: "", url: "", imageUrl: "" },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1.5 text-xs hover:bg-subtle"
                    >
                      <Plus size={13} /> Blank
                    </button>
                  </div>
                </div>
                {(recap.featured || []).map((f, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-line bg-card p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className={input}
                        value={f.title}
                        onChange={(e) =>
                          setFeatured(
                            (recap.featured || []).map((x, idx) =>
                              idx === i ? { ...x, title: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Title"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFeatured(
                            (recap.featured || []).filter((_, idx) => idx !== i)
                          )
                        }
                        className="rounded-md border border-line p-2 text-muted hover:bg-subtle"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className={cx(input, "mb-2 min-h-14")}
                      value={f.blurb || ""}
                      onChange={(e) =>
                        setFeatured(
                          (recap.featured || []).map((x, idx) =>
                            idx === i ? { ...x, blurb: e.target.value } : x
                          )
                        )
                      }
                      placeholder="Short blurb"
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        className={input}
                        value={f.url || ""}
                        onChange={(e) =>
                          setFeatured(
                            (recap.featured || []).map((x, idx) =>
                              idx === i ? { ...x, url: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Link URL"
                      />
                      <input
                        className={input}
                        value={f.imageUrl || ""}
                        onChange={(e) =>
                          setFeatured(
                            (recap.featured || []).map((x, idx) =>
                              idx === i ? { ...x, imageUrl: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Image URL (optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Top stories
                </p>
                {recap.stories.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-line bg-card p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-display text-lg">{s.rank}</span>
                      <input
                        className={input}
                        value={s.title}
                        onChange={(e) => setStory(i, { title: e.target.value })}
                        placeholder="Headline"
                      />
                    </div>
                    <textarea
                      className={cx(input, "mb-2 min-h-16")}
                      value={s.summary}
                      onChange={(e) => setStory(i, { summary: e.target.value })}
                      placeholder="Summary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={input}
                        value={s.category}
                        onChange={(e) =>
                          setStory(i, { category: e.target.value })
                        }
                        placeholder="Category"
                      />
                      <input
                        className={input}
                        value={s.region}
                        onChange={(e) => setStory(i, { region: e.target.value })}
                        placeholder="Region"
                      />
                      <input
                        className={input}
                        value={s.source || ""}
                        onChange={(e) => setStory(i, { source: e.target.value })}
                        placeholder="Source"
                      />
                      <input
                        className={input}
                        value={s.url || ""}
                        onChange={(e) => setStory(i, { url: e.target.value })}
                        placeholder="URL"
                      />
                      <input
                        className={cx(input, "col-span-2")}
                        value={s.imageUrl || ""}
                        onChange={(e) =>
                          setStory(i, { imageUrl: e.target.value })
                        }
                        placeholder="Image URL"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
                  Sign-off
                </label>
                <textarea
                  className={cx(input, "min-h-16")}
                  value={recap.signoff || ""}
                  onChange={(e) =>
                    setRecap({ ...recap, signoff: e.target.value })
                  }
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
                Body
              </label>
              <Editor
                value={nl.contentHtml}
                onChange={(html) => setNl({ ...nl, contentHtml: html })}
                placeholder="Write your email…"
              />
              <p className="mt-2 text-xs text-muted">
                A personalized greeting (Hi &lt;first name&gt;,) and the
                unsubscribe footer are added automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted">
            Preview {isRecap ? "(save to refresh)" : ""}
          </p>
          <div className="h-[70vh] overflow-hidden rounded-lg border border-line bg-white">
            <iframe
              title="preview"
              className="h-full w-full"
              srcDoc={previewDoc}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-subtle text-muted",
    pending_approval:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    sent: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  };
  return (
    <span
      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${
        styles[status] || "bg-subtle text-muted"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
