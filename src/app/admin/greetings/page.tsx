"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface Greeting {
  id: string;
  requesterName: string;
  requesterEmail: string;
  occasion: string;
  forName: string;
  onDate: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function GreetingsPage() {
  const [items, setItems] = useState<Greeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/greetings");
    const data = await res.json();
    setItems(data.greetings || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    await fetch("/api/admin/greetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Greeting requests</h1>
      <p className="mt-1 text-sm text-muted">
        Birthday &amp; anniversary notes visitors have asked you to send (from
        the hidden <code>/celebrate</code> page).
      </p>

      {loading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-muted">No requests yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((g) => (
            <div key={g.id} className="rounded-lg border border-line bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium capitalize">
                    {g.occasion}
                    {g.forName ? ` — for ${g.forName}` : ""}{" "}
                    <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                      {g.status}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    From {g.requesterName} · {g.requesterEmail}
                  </p>
                  {g.onDate && (
                    <p className="mt-1 text-sm">
                      Date: {new Date(g.onDate).toLocaleDateString()}
                    </p>
                  )}
                  {g.message && (
                    <p className="mt-2 max-w-lg text-sm text-muted">
                      “{g.message}”
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(g.id, "sent")}
                    disabled={!!busy || g.status === "sent"}
                    className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                  >
                    <Check size={15} /> Mark sent
                  </button>
                  <button
                    onClick={() => setStatus(g.id, "dismissed")}
                    disabled={!!busy}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle disabled:opacity-50"
                  >
                    <X size={15} /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
