"use client";

import { useEffect, useState } from "react";
import { CloudUpload } from "lucide-react";

interface Log {
  id: string;
  action: string;
  detail: string;
  actor: string;
  createdAt: string;
}

const TZ = "Asia/Kolkata";

function istStamp(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    setLogs(data.logs || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function exportNow() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/logs/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      setMsg(
        data.uploaded
          ? `Exported ${data.count} entries to Google Drive.`
          : data.message || "Nothing to export."
      );
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Activity log</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Major actions only — new articles, contacts, appointments, newsletters,
        quotes, launches. Not button clicks. Timestamps in IST. Logs export
        automatically to your Google Drive folder each month; you can also export
        the current month now.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={exportNow}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-50"
        >
          <CloudUpload size={15} /> {busy ? "Exporting…" : "Export to Drive now"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">When (IST)</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-subtle/50">
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {istStamp(l.createdAt)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3 text-muted">{l.detail || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  No activity logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
