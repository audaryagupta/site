"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface Item {
  id: string;
  title: string;
  author: string;
  link: string;
  note: string;
  category: string;
  order: number;
}

export default function NowManagerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [intro, setIntro] = useState("");
  const [form, setForm] = useState({
    title: "",
    author: "",
    link: "",
    note: "",
    category: "reading",
    order: 0,
  });
  const [msg, setMsg] = useState("");

  async function load() {
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/reading"),
      fetch("/api/admin/settings"),
    ]);
    const d1 = await r1.json();
    const d2 = await r2.json();
    setItems(d1.items || []);
    setIntro(d2.settings?.now_intro || "");
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.title.trim()) return;
    await fetch("/api/admin/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", author: "", link: "", note: "", category: form.category, order: 0 });
    load();
  }

  async function del(id: string) {
    await fetch("/api/admin/reading", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function saveIntro() {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { now_intro: intro } }),
    });
    setMsg("Intro saved.");
    setTimeout(() => setMsg(""), 2000);
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Now page</h1>
      <p className="mt-1 text-sm text-muted">
        Curate what you&apos;re reading, watching and doing right now.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-card p-4">
        <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
          Intro text
        </label>
        <textarea
          className={`${input} min-h-20`}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={saveIntro}
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Save intro
          </button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-card p-4">
        <p className="mb-3 text-sm font-medium">Add an item</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className={input}
            placeholder="Author / by"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <input
            className={input}
            placeholder="Link (optional)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          <select
            className={input}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="now">What I&apos;m doing now</option>
            <option value="reading">Reading</option>
            <option value="watching">Watching &amp; listening</option>
          </select>
          <input
            className={`${input} sm:col-span-2`}
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <button
          onClick={add}
          className="mt-3 rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          Add
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm"
          >
            <div>
              <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">
                {it.category}
              </span>{" "}
              <span className="font-medium">{it.title}</span>{" "}
              {it.author && <span className="text-muted">· {it.author}</span>}
            </div>
            <button
              onClick={() => del(it.id)}
              className="text-muted hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
