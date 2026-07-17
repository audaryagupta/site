"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Undo2, Trash2 } from "lucide-react";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

export function AccessManager() {
  const [owner, setOwner] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/team");
    const data = await res.json();
    setOwner(data.owner || "");
    setMembers(data.members || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(
        data.emailed
          ? `Invited ${email} — an email was sent.`
          : `Invited ${email}. (No email sent — SMTP not configured; just tell them to sign in.)`
      );
      setEmail("");
      setName("");
      load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this member entirely?")) return;
    await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
    load();
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Access</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Invite secretaries or assistants to the Studio. They sign in with the
        Google account you list here. Members can use the dashboard but can’t
        manage access or launch settings. Every action they take is recorded in
        the activity log under their email.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-subtle/40 px-4 py-3 text-sm">
        <ShieldCheck size={16} className="text-muted" />
        <span>
          Owner: <strong>{owner}</strong> (full control)
        </span>
      </div>

      <form
        onSubmit={invite}
        className="mt-6 grid gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <label className="mb-1 block text-xs text-muted">Email (Google account)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            placeholder="secretary@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
            placeholder="Full name"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <UserPlus size={15} /> {busy ? "Inviting…" : "Invite"}
          </button>
        </div>
      </form>
      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-subtle/50">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3 text-muted">{m.name || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.status === "active"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "rounded-full bg-subtle px-2 py-0.5 text-xs text-muted"
                    }
                  >
                    {m.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(m.createdAt))}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {m.status === "active" ? (
                      <button
                        onClick={() => setStatus(m.id, "revoked")}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs hover:bg-subtle"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(m.id, "active")}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs hover:bg-subtle"
                      >
                        <Undo2 size={13} /> Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => remove(m.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No team members yet. Invite one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
