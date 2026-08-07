"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import RecapSchedule from "./RecapSchedule";

interface NL {
  id: string;
  type: string;
  subject: string;
  status: string;
  audience: string;
  recipientCount: number;
  createdAt: string;
  sentAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-subtle text-muted",
  pending_approval:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  sending: "bg-subtle text-muted",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function NewslettersPage() {
  const router = useRouter();
  const [list, setList] = useState<NL[]>([]);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/newsletters");
    const data = await res.json();
    setList(data.newsletters || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function generateRecap() {
    setGen(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_recap" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (!data.grounded)
        setMsg(
          "Generated from the model's knowledge (no live news key set). Review links carefully."
        );
      router.push(`/admin/newsletters/${data.newsletter.id}`);
    } catch (e) {
      setMsg((e as Error).message);
      setGen(false);
    }
  }

  async function createGeneric(type: string) {
    const res = await fetch("/api/admin/newsletters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        subject: type === "birthday" ? "Happy Birthday!" : "",
        audience: type === "birthday" || type === "promo" ? "contacts" : "subscribers",
      }),
    });
    const data = await res.json();
    router.push(`/admin/newsletters/${data.newsletter.id}`);
  }

  async function del(id: string) {
    if (!confirm("Delete this newsletter?")) return;
    await fetch(`/api/admin/newsletters/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Newsletters</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateRecap}
            disabled={gen}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {gen ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            Generate Weekly Recap
          </button>
          <button
            onClick={() => createGeneric("general")}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            + General
          </button>
          <button
            onClick={() => createGeneric("promo")}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            + Promo
          </button>
          <button
            onClick={() => createGeneric("birthday")}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            + Birthday
          </button>
        </div>
      </div>

      {msg && (
        <p className="mb-4 rounded-md border border-line bg-subtle p-3 text-sm text-muted">
          {msg}
        </p>
      )}

      <RecapSchedule />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-muted">
          No newsletters yet. Generate a Weekly Recap to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((n) => (
                <tr
                  key={n.id}
                  className="cursor-pointer hover:bg-subtle/50"
                  onClick={() => router.push(`/admin/newsletters/${n.id}`)}
                >
                  <td className="px-4 py-3 font-medium">
                    {n.subject || "(untitled)"}
                  </td>
                  <td className="px-4 py-3 text-muted">{n.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        STATUS_STYLES[n.status] || "bg-subtle text-muted"
                      }`}
                    >
                      {n.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{n.audience}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(n.createdAt)}
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => del(n.id)}
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
