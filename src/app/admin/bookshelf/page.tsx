"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { cx } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string;
  status: "want" | "reading" | "finished" | string;
  rating: number;
  notes: string;
  coverUrl: string | null;
}

const input =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

const STATUS_LABEL: Record<string, string> = {
  want: "Want to read",
  reading: "Reading now",
  finished: "Finished",
};

export default function BookshelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState({
    title: "",
    author: "",
    status: "reading",
    coverUrl: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/books");
    if (res.ok) setBooks((await res.json()).books || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", author: "", status: form.status, coverUrl: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, patch: Partial<Book>) {
    setBooks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    await fetch("/api/admin/books", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this book?")) return;
    await fetch(`/api/admin/books?id=${id}`, { method: "DELETE" });
    await load();
  }

  const sections: ("reading" | "want" | "finished")[] = [
    "reading",
    "want",
    "finished",
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">My Bookshelf</h1>
      <p className="mt-1 text-sm text-muted">
        Log books as you read them. Private to your dashboard.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Book title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          />
          <select
            className={input}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="reading">Reading now</option>
            <option value="want">Want to read</option>
            <option value="finished">Finished</option>
          </select>
          <input
            className={input}
            placeholder="Cover image URL (optional)"
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
          />
        </div>
        <button
          onClick={add}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          <Plus size={15} /> {saving ? "Adding…" : "Add book"}
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {sections.map((s) => {
          const items = books.filter((b) => b.status === s);
          if (items.length === 0) return null;
          return (
            <div key={s}>
              <h2 className="mb-3 text-sm font-semibold">
                {STATUS_LABEL[s]}{" "}
                <span className="font-normal text-muted">({items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((b) => (
                  <div
                    key={b.id}
                    className="flex gap-3 rounded-lg border border-line bg-card p-3"
                  >
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.coverUrl}
                        alt=""
                        className="h-24 w-16 flex-none rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-16 flex-none items-center justify-center rounded bg-subtle text-xs text-muted">
                        No cover
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{b.title}</p>
                          {b.author && (
                            <p className="truncate text-xs text-muted">
                              {b.author}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(b.id)}
                          className="text-muted hover:text-red-500"
                          aria-label="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              patch(b.id, { rating: n === b.rating ? 0 : n })
                            }
                            aria-label={`${n} star`}
                          >
                            <Star
                              size={15}
                              className={cx(
                                n <= b.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted"
                              )}
                            />
                          </button>
                        ))}
                      </div>

                      <select
                        className="mt-2 rounded-md border border-line bg-background px-2 py-1 text-xs"
                        value={b.status}
                        onChange={(e) => patch(b.id, { status: e.target.value })}
                      >
                        <option value="reading">Reading now</option>
                        <option value="want">Want to read</option>
                        <option value="finished">Finished</option>
                      </select>

                      <textarea
                        className="mt-2 w-full rounded-md border border-line bg-background px-2 py-1 text-xs outline-none focus:border-foreground"
                        placeholder="Notes / thoughts"
                        defaultValue={b.notes}
                        onBlur={(e) => patch(b.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {books.length === 0 && (
          <p className="rounded-lg border border-dashed border-line bg-card p-6 text-center text-sm text-muted">
            Your shelf is empty — add the book you&apos;re reading now.
          </p>
        )}
      </div>
    </div>
  );
}
