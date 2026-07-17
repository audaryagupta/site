"use client";

import { useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function upload() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMsg(`Imported ${data.added} contact(s).`);
      setCsv("");
      load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Private contacts</h1>
      <p className="mt-1 text-sm text-muted">
        Your private list for birthday and promotional emails. Separate from
        newsletter subscribers.
      </p>

      <div className="mt-6 rounded-lg border border-line bg-card p-4">
        <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
          Bulk import (CSV)
        </label>
        <p className="mb-2 text-xs text-muted">
          Columns: <code>email,firstName,lastName,birthday</code> (birthday
          optional, e.g. 1999-08-24). One per line.
        </p>
        <textarea
          className="min-h-28 w-full rounded-md border border-line bg-background p-3 font-mono text-xs outline-none focus:border-foreground"
          placeholder={"email,firstName,lastName,birthday\njane@x.com,Jane,Doe,1998-04-12"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={upload}
            disabled={busy || !csv.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <Upload size={15} /> {busy ? "Importing…" : "Import"}
          </button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm text-muted">{contacts.length} contact(s)</p>
        {contacts.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Birthday</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.birthday ? formatDate(c.birthday) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => del(c.id)}
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
    </div>
  );
}
