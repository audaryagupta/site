"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2, Circle } from "lucide-react";
import { cx } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  detail: string;
  horizon: "short" | "long" | string;
  done: boolean;
  completedAt: string | null;
}

const input =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState({ title: "", detail: "", horizon: "short" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/goals");
    if (res.ok) setGoals((await res.json()).goals || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", detail: "", horizon: form.horizon });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(g: Goal) {
    setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)));
    await fetch("/api/admin/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: g.id, done: !g.done }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/admin/goals?id=${id}`, { method: "DELETE" });
    await load();
  }

  const columns: { key: "short" | "long"; label: string }[] = [
    { key: "short", label: "Short-term goals" },
    { key: "long", label: "Long-term goals" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Goals</h1>
      <p className="mt-1 text-sm text-muted">
        Your private short- and long-term goals. Tick them off as you go — only
        you can see these.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className={input}
            placeholder="New goal…"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <select
            className={input}
            value={form.horizon}
            onChange={(e) => setForm((f) => ({ ...f, horizon: e.target.value }))}
          >
            <option value="short">Short-term</option>
            <option value="long">Long-term</option>
          </select>
        </div>
        <textarea
          className={cx(input, "mt-3 min-h-16")}
          placeholder="Optional detail / why it matters"
          value={form.detail}
          onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
        />
        <button
          onClick={add}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          <Plus size={15} /> {saving ? "Adding…" : "Add goal"}
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {columns.map((col) => {
          const items = goals.filter((g) => g.horizon === col.key);
          const done = items.filter((g) => g.done).length;
          return (
            <div key={col.key}>
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">
                {col.label}
                <span className="text-xs font-normal text-muted">
                  {done}/{items.length} done
                </span>
              </h2>
              <div className="space-y-2">
                {items.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-start gap-3 rounded-lg border border-line bg-card p-3"
                  >
                    <button
                      onClick={() => toggle(g)}
                      className={cx(
                        "mt-0.5 flex-none rounded-full transition",
                        g.done ? "text-green-600" : "text-muted hover:text-foreground"
                      )}
                      aria-label={g.done ? "Mark not done" : "Mark done"}
                    >
                      {g.done ? <Check size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cx(
                          "text-sm font-medium",
                          g.done && "text-muted line-through"
                        )}
                      >
                        {g.title}
                      </p>
                      {g.detail && (
                        <p className="mt-0.5 text-xs text-muted">{g.detail}</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(g.id)}
                      className="text-muted hover:text-red-500"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line bg-card p-5 text-center text-xs text-muted">
                    Nothing here yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
