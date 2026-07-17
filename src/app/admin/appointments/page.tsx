"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface Appt {
  id: string;
  name: string;
  email: string;
  phone: string;
  purpose: string;
  mode: string;
  requestedStart: string;
  requestedEnd: string;
  status: string;
  meetingLink: string | null;
  location: string | null;
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cities, setCities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppts(data.appointments || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "accept" | "reject", force = false) {
    setBusy(id + action);
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        message: notes[id] || "",
        location: cities[id] || "",
        force,
      }),
    });
    const data = await res.json();
    setBusy(null);
    if (data.conflict) {
      if (confirm(`${data.conflict}`)) {
        return act(id, action, true);
      }
      return;
    }
    if (data.warnings?.length) alert(data.warnings.join("\n"));
    load();
  }

  const pending = appts.filter((a) => a.status === "pending");
  const others = appts.filter((a) => a.status !== "pending");

  function fmt(iso: string) {
    return (
      new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }) + " IST"
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Appointments</h1>
      <p className="mt-1 text-sm text-muted">
        Accept to auto-create the calendar event / meeting link and email the
        requester. Reject to send a polite decline.
      </p>

      {loading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : (
        <>
          <h2 className="mb-3 mt-8 font-display text-lg font-semibold">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-line bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {a.name}{" "}
                        <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                          {a.mode}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {a.email}
                        {a.phone ? ` · ${a.phone}` : ""}
                      </p>
                      <p className="mt-1 text-sm">{fmt(a.requestedStart)}</p>
                      {a.purpose && (
                        <p className="mt-2 max-w-lg text-sm text-muted">
                          “{a.purpose}”
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(a.id, "accept")}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                      >
                        <Check size={15} /> Accept
                      </button>
                      <button
                        onClick={() => act(a.id, "reject")}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle disabled:opacity-50"
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                    {a.mode === "physical" && (
                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                          Current city / place (in-person)
                        </span>
                        <input
                          value={cities[a.id] || ""}
                          onChange={(e) =>
                            setCities((c) => ({ ...c, [a.id]: e.target.value }))
                          }
                          placeholder="e.g. Boston, MA · Delhi office"
                          className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                    )}
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                        Message to requester (optional)
                      </span>
                      <input
                        value={notes[a.id] || ""}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [a.id]: e.target.value }))
                        }
                        placeholder="Added to the confirmation / decline email"
                        className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {others.length > 0 && (
            <>
              <h2 className="mb-3 mt-10 font-display text-lg font-semibold">
                History
              </h2>
              <div className="overflow-hidden rounded-lg border border-line bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {others.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3">{a.name}</td>
                        <td className="px-4 py-3 text-muted">
                          {fmt(a.requestedStart)}
                        </td>
                        <td className="px-4 py-3 text-muted">{a.mode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              a.status === "accepted"
                                ? "text-green-700 dark:text-green-400"
                                : "text-muted"
                            }
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
