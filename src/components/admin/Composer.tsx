"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Users, Check } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { cx } from "@/lib/utils";

interface Person {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
}

export function Composer({ ownerEmail }: { ownerEmail: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeBanner, setIncludeBanner] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const [contacts, setContacts] = useState<Person[]>([]);
  const [subscribers, setSubscribers] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []))
      .catch(() => {});
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then((d) => setSubscribers(d.subscribers || []))
      .catch(() => {});
  }, []);

  const manualEmails = useMemo(
    () =>
      manual
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    [manual]
  );

  const allRecipients = useMemo(
    () => Array.from(new Set([...Array.from(selected), ...manualEmails])),
    [selected, manualEmails]
  );

  function toggle(email: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }
  function toggleAll(list: Person[]) {
    setSelected((s) => {
      const next = new Set(s);
      const emails = list.map((p) => p.email);
      const allOn = emails.every((e) => next.has(e));
      for (const e of emails) {
        if (allOn) next.delete(e);
        else next.add(e);
      }
      return next;
    });
  }

  async function send(recipients: string[]) {
    if (!subject.trim() || !body.trim() || recipients.length === 0) {
      setResult("Add a subject, a message and at least one recipient.");
      return;
    }
    setSending(true);
    setResult("");
    const res = await fetch("/api/admin/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        bodyHtml: body,
        recipients,
        includeBanner,
        includeSignature,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setResult(data.error || "Send failed.");
      return;
    }
    const failed = (data.errors || []).length;
    setResult(
      `Sent to ${data.sent}/${data.total}.${
        failed ? ` ${failed} failed — check the mailbox is connected.` : ""
      }`
    );
  }

  const input =
    "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      {/* Message */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Subject</label>
          <input
            className={cx(input, "mt-1")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <div className="mt-1">
            <RichTextEditor
              value={body}
              onChange={setBody}
              minHeight={280}
              placeholder="Write your message… it'll be wrapped in your branded template with the banner and signature."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeBanner}
              onChange={(e) => setIncludeBanner(e.target.checked)}
            />
            Include banner
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
            />
            Include signature
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button
            onClick={() => send(allRecipients)}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            <Send size={15} />
            {sending ? "Sending…" : `Send to ${allRecipients.length} recipient(s)`}
          </button>
          <button
            onClick={() => send([ownerEmail])}
            disabled={sending}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle disabled:opacity-50"
          >
            Send test to me
          </button>
          {result && <span className="text-sm text-muted">{result}</span>}
        </div>
        <p className="text-xs text-muted">
          Sent from your personal mailbox (audarya@byaudarya.com once connected).
        </p>
      </div>

      {/* Recipients */}
      <div className="space-y-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Users size={15} /> Recipients ({allRecipients.length})
          </p>
        </div>

        <RecipientList
          title="Contacts"
          people={contacts}
          selected={selected}
          onToggle={toggle}
          onToggleAll={() => toggleAll(contacts)}
        />
        <RecipientList
          title="Subscribers"
          people={subscribers.filter(
            (s) => !s.status || s.status === "active"
          )}
          selected={selected}
          onToggle={toggle}
          onToggleAll={() =>
            toggleAll(
              subscribers.filter((s) => !s.status || s.status === "active")
            )
          }
        />

        <div>
          <p className="text-sm font-medium">Add emails manually</p>
          <textarea
            className={cx(input, "mt-1 min-h-20")}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="one@example.com, two@example.com"
          />
          {manualEmails.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              {manualEmails.length} valid address(es)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipientList({
  title,
  people,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string;
  people: Person[];
  selected: Set<string>;
  onToggle: (email: string) => void;
  onToggleAll: () => void;
}) {
  const count = people.filter((p) => selected.has(p.email)).length;
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {title}{" "}
          <span className="text-muted">
            ({count}/{people.length})
          </span>
        </p>
        <button
          onClick={onToggleAll}
          className="text-xs text-muted hover:text-foreground"
        >
          Select all
        </button>
      </div>
      <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-line bg-card p-1">
        {people.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted">None yet.</p>
        ) : (
          people.map((p) => {
            const on = selected.has(p.email);
            const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
            return (
              <button
                key={p.email}
                onClick={() => onToggle(p.email)}
                className={cx(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs",
                  on ? "bg-subtle" : "hover:bg-subtle/60"
                )}
              >
                <span
                  className={cx(
                    "flex h-4 w-4 flex-none items-center justify-center rounded border",
                    on ? "border-foreground bg-foreground text-background" : "border-line"
                  )}
                >
                  {on && <Check size={11} />}
                </span>
                <span className="truncate">
                  {name ? `${name} · ` : ""}
                  {p.email}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
