"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Upload, FileUp } from "lucide-react";

interface Quote {
  id: string;
  text: string;
  author: string;
  mine: boolean;
  active: boolean;
}

export default function GamesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState({ text: "", author: "", mine: true });
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/quotes");
    const data = await res.json();
    setQuotes(data.quotes || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) return;
    await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: [form] }),
    });
    setForm({ text: "", author: "", mine: true });
    load();
  }

  async function importCsv(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      setMsg(`Imported ${data.added} quote(s).`);
      setCsv("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await importCsv(await file.text());
    if (fileRef.current) fileRef.current.value = "";
  }

  async function toggle(q: Quote) {
    await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: q.id, active: !q.active }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this quote?")) return;
    await fetch("/api/admin/quotes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const input =
    "h-10 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";
  const mineCount = quotes.filter((q) => q.mine).length;
  const famousCount = quotes.length - mineCount;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">
        Games — “Who said it?”
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Manage the quote bank for the hidden game. Each round shows one of your
        quotes plus two famous ones. Mark a quote as <strong>yours</strong> or
        leave it as a famous quote (with an author). You have {mineCount} of your
        own and {famousCount} famous — the game needs at least 1 of yours and 2
        famous, otherwise it uses the built-in set.
      </p>

      {/* Add one */}
      <form
        onSubmit={addOne}
        className="mt-6 grid items-end gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-12"
      >
        <label className="block sm:col-span-6">
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
            Quote
          </span>
          <input
            className={input}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </label>
        <label className="block sm:col-span-3">
          <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
            Author (famous only)
          </span>
          <input
            className={input}
            placeholder="e.g. Steve Jobs"
            value={form.author}
            disabled={form.mine}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 sm:col-span-1">
          <input
            type="checkbox"
            checked={form.mine}
            onChange={(e) => setForm((f) => ({ ...f, mine: e.target.checked }))}
          />
          <span className="text-sm">Mine</span>
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm text-background sm:col-span-2"
        >
          <Plus size={15} /> Add
        </button>
      </form>

      {/* CSV import */}
      <div className="mt-6 rounded-lg border border-line bg-card p-4">
        <p className="mb-1 text-sm font-medium">Bulk import (CSV)</p>
        <p className="mb-3 text-xs text-muted">
          Columns: <code>text,author,mine</code> — <code>mine</code> is{" "}
          <code>true</code>/<code>false</code>. Leave author blank for your own
          quotes. Wrap quotes containing commas in double quotes.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-50"
          >
            <FileUp size={15} /> Upload CSV file
          </button>
          <a
            href={
              "data:text/csv;charset=utf-8," +
              encodeURIComponent(
                'text,author,mine\n"Curiosity is the whole game.",,true\n"Stay hungry, stay foolish.",Steve Jobs,false\n'
              )
            }
            download="quotes-template.csv"
            className="text-xs text-muted underline hover:text-foreground"
          >
            Download template
          </a>
        </div>
        <textarea
          className="min-h-24 w-full rounded-md border border-line bg-background p-3 font-mono text-xs outline-none focus:border-foreground"
          placeholder={
            'text,author,mine\n"A good essay earns its ending.",,true\n"Knowledge is power.",Francis Bacon,false'
          }
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => importCsv(csv)}
            disabled={busy || !csv.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <Upload size={15} /> {busy ? "Importing…" : "Import pasted rows"}
          </button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-2">
        {quotes.length === 0 ? (
          <p className="text-sm text-muted">No quotes yet.</p>
        ) : (
          quotes.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-md border border-line bg-card px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <span
                  className={
                    "mr-2 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide " +
                    (q.mine
                      ? "bg-foreground text-background"
                      : "bg-subtle text-muted")
                  }
                >
                  {q.mine ? "Mine" : "Famous"}
                </span>
                <span className={q.active ? "" : "line-through opacity-50"}>
                  “{q.text}”
                </span>
                {q.author && (
                  <span className="text-muted"> — {q.author}</span>
                )}
              </div>
              <div className="flex flex-none items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={q.active}
                    onChange={() => toggle(q)}
                  />
                  Active
                </label>
                <button
                  onClick={() => del(q.id)}
                  className="text-muted hover:text-red-500"
                  aria-label="Delete quote"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
