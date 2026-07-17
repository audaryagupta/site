"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, MessageSquare, Clock } from "lucide-react";

interface Row {
  id: string;
  title: string;
  slug: string;
  status: string;
  readingMinutes: number;
  views: number;
  likes: number;
  viewsBoost: number;
  likesBoost: number;
  comments: number;
  publicViews: number;
  publicLikes: number;
  publishedAt: string | null;
}

interface Totals {
  realViews: number;
  realLikes: number;
  publicViews: number;
  publicLikes: number;
  comments: number;
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

export default function AnalyticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/analytics");
    const data = await res.json();
    setRows(data.rows || []);
    setTotals(data.totals || null);
  }
  useEffect(() => {
    load();
  }, []);

  function setLocal(id: string, key: "viewsBoost" | "likesBoost", v: number) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: v } : r)));
  }

  async function saveBoost(r: Row) {
    setSavingId(r.id);
    try {
      await fetch("/api/admin/analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          viewsBoost: r.viewsBoost,
          likesBoost: r.likesBoost,
        }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  }

  const boxInput =
    "h-8 w-20 rounded-md border border-line bg-background px-2 text-sm outline-none focus:border-foreground";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Analytics</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Real numbers are what actually happened. The <strong>boost</strong> is
        added only to the public count shown on the site — the “Public” columns
        are what visitors see. Reading time and comments are shown per article.
      </p>

      {totals && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Eye size={15} />} label="Real views" value={totals.realViews} sub={`${fmt(totals.publicViews)} public`} />
          <Stat icon={<Heart size={15} />} label="Real likes" value={totals.realLikes} sub={`${fmt(totals.publicLikes)} public`} />
          <Stat icon={<MessageSquare size={15} />} label="Comments" value={totals.comments} />
          <Stat icon={<Clock size={15} />} label="Articles" value={rows.length} />
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-3 py-3">Read</th>
              <th className="px-3 py-3">Real views</th>
              <th className="px-3 py-3">+Boost</th>
              <th className="px-3 py-3">Public</th>
              <th className="px-3 py-3">Real likes</th>
              <th className="px-3 py-3">+Boost</th>
              <th className="px-3 py-3">Public</th>
              <th className="px-3 py-3">Comments</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-middle">
                <td className="px-4 py-3">
                  <span className="font-medium">{r.title}</span>
                  {r.status !== "published" && (
                    <span className="ml-2 rounded bg-subtle px-1.5 py-0.5 text-xs text-muted">
                      draft
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted">{r.readingMinutes}m</td>
                <td className="px-3 py-3">{fmt(r.views)}</td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={0}
                    className={boxInput}
                    value={r.viewsBoost}
                    onChange={(e) =>
                      setLocal(r.id, "viewsBoost", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-3 font-medium">
                  {fmt(r.views + r.viewsBoost)}
                </td>
                <td className="px-3 py-3">{fmt(r.likes)}</td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={0}
                    className={boxInput}
                    value={r.likesBoost}
                    onChange={(e) =>
                      setLocal(r.id, "likesBoost", Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-3 py-3 font-medium">
                  {fmt(r.likes + r.likesBoost)}
                </td>
                <td className="px-3 py-3 text-muted">{r.comments}</td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => saveBoost(r)}
                    disabled={savingId === r.id}
                    className="rounded-md border border-line px-3 py-1 text-xs font-medium hover:bg-subtle disabled:opacity-50"
                  >
                    {savingId === r.id ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-muted">
                  No articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{fmt(value)}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}
