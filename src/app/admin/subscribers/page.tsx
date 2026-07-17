"use client";

import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Sub {
  id: string;
  email: string;
  firstName: string;
  status: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

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
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

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
