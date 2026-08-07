"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload, Plus, FileUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  anniversary: string | null;
  createdAt: string;
}

const emptyForm = {
  email: "",
  firstName: "",
  lastName: "",
  birthday: "",
  anniversary: "",
  notes: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formMsg, setFormMsg] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function importCsv(text: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importCsv(text);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    setFormBusy(true);
    setFormMsg("");
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [form] }),
      });
      const data = await res.json();
      if (!res.ok || !data.added) throw new Error(data.error || "Check the email address");
      setFormMsg("Saved.");
      setForm({ ...emptyForm });
      load();
    } catch (e) {
      setFormMsg((e as Error).message);
    } finally {
      setFormBusy(false);
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

  const input =
    "h-10 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";
  const label = "mb-1 block text-xs uppercase tracking-widest text-muted";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Private contacts</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Your private list for birthday, anniversary and promotional emails.
        Separate from newsletter subscribers. Add people one at a time or import
        a CSV.
      </p>

      {/* Add one via form */}
      <form
        onSubmit={addOne}
        className="mt-6 rounded-lg border border-line bg-card p-4"
      >
        <p className="mb-3 text-sm font-medium">Add a contact</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={label}>Email *</span>
            <input
              type="email"
              required
              className={input}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={label}>First name</span>
            <input
              className={input}
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={label}>Last name</span>
            <input
              className={input}
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={label}>Birthday</span>
            <input
              type="date"
              className={input}
              value={form.birthday}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthday: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={label}>Anniversary</span>
            <input
              type="date"
              className={input}
              value={form.anniversary}
              onChange={(e) =>
                setForm((f) => ({ ...f, anniversary: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={label}>Notes</span>
            <input
              className={input}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={formBusy || !form.email.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <Plus size={15} /> {formBusy ? "Saving…" : "Add contact"}
          </button>
          {formMsg && <span className="text-sm text-muted">{formMsg}</span>}
        </div>
      </form>

      {/* Bulk CSV: file upload or paste */}
      <div className="mt-6 rounded-lg border border-line bg-card p-4">
        <p className="mb-1 text-sm font-medium">Bulk import (CSV)</p>
        <p className="mb-3 text-xs text-muted">
          Columns:{" "}
          <code>email,firstName,lastName,birthday,anniversary</code> — dates
          optional (e.g. 1999-08-24). Upload a file or paste rows below.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-50"
          >
            <FileUp size={15} /> Upload CSV file
          </button>
          <a
            href={
              "data:text/csv;charset=utf-8," +
              encodeURIComponent(
                "email,firstName,lastName,birthday,anniversary\njane@example.com,Jane,Doe,1998-04-12,2020-11-05\n"
              )
            }
            download="contacts-template.csv"
            className="text-xs text-muted underline hover:text-foreground"
          >
            Download template
          </a>
        </div>

        <textarea
          className="min-h-28 w-full rounded-md border border-line bg-background p-3 font-mono text-xs outline-none focus:border-foreground"
          placeholder={
            "email,firstName,lastName,birthday,anniversary\njane@x.com,Jane,Doe,1998-04-12,2020-11-05"
          }
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => importCsv(csv)}
            disabled={busy || !csv.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <Upload size={15} /> {busy ? "Importing…" : "Import pasted rows"}
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
                  <th className="px-4 py-3">Anniversary</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.birthday ? formatDate(c.birthday) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.anniversary ? formatDate(c.anniversary) : "—"}
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
