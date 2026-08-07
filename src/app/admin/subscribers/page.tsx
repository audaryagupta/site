"use client";

import { useEffect, useState } from "react";
import { Download, Trash2, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Sub {
  id: string;
  email: string;
  firstName: string;
  status: string;
  source?: string;
  addedByOwner?: boolean;
  welcomeRemaining?: number;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/subscribers");
    const data = await res.json();
    setSubs(data.subscribers || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function addSubscribers() {
    if (!text.trim()) return;
    setSaving(true);
    setResult(null);
    const res = await fetch("/api/admin/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, notify }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      const parts = [`${data.added} added`];
      if (data.skipped) parts.push(`${data.skipped} already existed`);
      if (data.invalid?.length) parts.push(`${data.invalid.length} invalid`);
      setResult(parts.join(" · "));
      setText("");
      load();
    } else {
      setResult("Something went wrong.");
    }
  }

  function exportCsv() {
    const rows = [
      ["email", "firstName", "status", "createdAt"],
      ...subs.map((s) => [s.email, s.firstName, s.status, s.createdAt]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
  }

  const active = subs.filter((s) => s.status === "active").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">
            {active} active · {subs.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            <UserPlus size={15} /> Add subscribers
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-line bg-card p-5">
          <h2 className="text-sm font-medium">Add / merge subscribers</h2>
          <p className="mt-1 text-sm text-muted">
            One per line. Use <code>email</code> or{" "}
            <code>email, First Name</code>. Duplicates are skipped. Great for
            merging your old blog list.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"jane@example.com, Jane\njohn@example.com"}
            className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2 font-mono text-sm"
          />
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-1"
            />
            <span>
              Let them know I added them — their first 4 newsletters open with
              &ldquo;Audarya Gupta has added you to the newsletter&rdquo;.
            </span>
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={addSubscribers}
              disabled={saving || !text.trim()}
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add subscribers"}
            </button>
            {result && <span className="text-sm text-muted">{result}</span>}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="text-muted">No subscribers yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-muted">{s.firstName || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.status === "active" ? "" : "text-muted line-through"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.addedByOwner ? "added by you" : s.source || "website"}
                    {s.welcomeRemaining ? (
                      <span className="ml-1 rounded bg-subtle px-1.5 py-0.5 text-xs">
                        note ×{s.welcomeRemaining}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => del(s.id)}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
