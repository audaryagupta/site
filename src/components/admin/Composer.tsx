"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Clock, X, Trash2 } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { cx } from "@/lib/utils";
import { TIMEZONES, DEFAULT_TIMEZONE, zonedWallTimeToUtc } from "@/lib/timezones";

interface Person {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
}

interface Scheduled {
  id: string;
  subject: string;
  count: number;
  sendAt: string;
  status: string;
  sentCount: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Composer({ ownerEmail }: { ownerEmail: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeBanner, setIncludeBanner] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const [people, setPeople] = useState<Person[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);

  const [schedule, setSchedule] = useState(false);
  const [sendAtLocal, setSendAtLocal] = useState("");
  const [tz, setTz] = useState(DEFAULT_TIMEZONE);
  const [scheduled, setScheduled] = useState<Scheduled[]>([]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    async function load() {
      const [c, s, settings] = await Promise.all([
        fetch("/api/admin/contacts").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/subscribers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/admin/settings").then((r) => r.json()).catch(() => ({})),
      ]);
      const subs: Person[] = (s.subscribers || []).filter(
        (x: Person) => !x.status || x.status === "active"
      );
      // Merge & de-dupe by email.
      const map = new Map<string, Person>();
      for (const p of [...(c.contacts || []), ...subs]) {
        if (p?.email) map.set(p.email.toLowerCase(), p);
      }
      setPeople(Array.from(map.values()));
      if (settings.settings?.site_timezone)
        setTz(settings.settings.site_timezone);
    }
    load();
    refreshScheduled();
  }, []);

  async function refreshScheduled() {
    const d = await fetch("/api/admin/compose/scheduled")
      .then((r) => r.json())
      .catch(() => ({}));
    setScheduled(d.scheduled || []);
  }

  function addRecipient(raw: string) {
    const email = raw.trim().toLowerCase().replace(/[,;]$/, "");
    if (!EMAIL_RE.test(email)) return false;
    setRecipients((r) => (r.includes(email) ? r : [...r, email]));
    return true;
  }
  function removeRecipient(email: string) {
    setRecipients((r) => r.filter((e) => e !== email));
  }

  function resetForm() {
    setSubject("");
    setBody("");
    setRecipients([]);
    setSchedule(false);
    setSendAtLocal("");
  }

  async function submit(to: string[], isTest = false) {
    if (!subject.trim() || !body.trim() || to.length === 0) {
      setResult("Add a subject, a message and at least one recipient.");
      return;
    }
    let sendAt: string | undefined;
    if (schedule) {
      if (!sendAtLocal) {
        setResult("Pick a date & time to schedule.");
        return;
      }
      const utc = zonedWallTimeToUtc(sendAtLocal, tz);
      if (Number.isNaN(utc.getTime()) || utc.getTime() < Date.now()) {
        setResult("Choose a future date & time.");
        return;
      }
      sendAt = utc.toISOString();
    }
    setSending(true);
    setResult("");
    const res = await fetch("/api/admin/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        bodyHtml: body,
        recipients: to,
        includeBanner,
        includeSignature,
        sendAt,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setResult(data.error || "Send failed.");
      return;
    }
    if (data.scheduled) {
      setResult(`Scheduled for ${data.total} recipient(s).`);
      if (!isTest) resetForm();
      refreshScheduled();
      return;
    }
    const failed = (data.errors || []).length;
    setResult(
      `Sent to ${data.sent}/${data.total}.${
        failed ? " Some failed — is the mailbox connected & Gmail API enabled?" : ""
      }`
    );
    // Clear the composer after a real send so the message doesn't linger.
    // Keep the form intact for "Send test to me" so you can send the real one.
    if (!isTest && data.sent > 0 && failed === 0) resetForm();
  }

  async function cancelScheduled(id: string) {
    await fetch(`/api/admin/compose/scheduled?id=${id}`, { method: "DELETE" });
    refreshScheduled();
  }

  const input =
    "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-4">
        <RecipientInput
          people={people}
          recipients={recipients}
          onAdd={addRecipient}
          onRemove={removeRecipient}
        />

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
              minHeight={360}
              placeholder="Write your message… it's wrapped in your branded template with the banner and signature."
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
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => setSchedule(e.target.checked)}
            />
            Schedule for later
          </label>
        </div>

        {schedule && (
          <div className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-subtle/40 p-3">
            <div>
              <label className="text-xs font-medium text-muted">
                Date &amp; time
              </label>
              <input
                type="datetime-local"
                className={cx(input, "mt-1")}
                value={sendAtLocal}
                onChange={(e) => setSendAtLocal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Time zone</label>
              <select
                className={cx(input, "mt-1")}
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              >
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button
            onClick={() => submit(recipients)}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            {schedule ? <Clock size={15} /> : <Send size={15} />}
            {sending
              ? "Working…"
              : schedule
              ? `Schedule for ${recipients.length}`
              : `Send to ${recipients.length}`}
          </button>
          <button
            onClick={() => submit([ownerEmail], true)}
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

      {/* Sidebar: scheduled queue */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Scheduled &amp; recent</p>
        {scheduled.length === 0 ? (
          <p className="text-xs text-muted">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {scheduled.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-line bg-card p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{s.subject || "(no subject)"}</span>
                  {s.status === "scheduled" && (
                    <button
                      onClick={() => cancelScheduled(s.id)}
                      title="Cancel"
                      className="text-muted hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="mt-1 text-muted">
                  {s.count} recipient(s) ·{" "}
                  <span
                    className={cx(
                      s.status === "scheduled" && "text-amber-600",
                      s.status === "sent" && "text-green-600",
                      s.status === "failed" && "text-red-600"
                    )}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="mt-0.5 text-muted">
                  {new Date(s.sendAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RecipientInput({
  people,
  recipients,
  onAdd,
  onRemove,
}: {
  people: Person[];
  recipients: string[];
  onAdd: (raw: string) => boolean;
  onRemove: (email: string) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => {
        if (recipients.includes(p.email.toLowerCase())) return false;
        const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
        return p.email.toLowerCase().includes(q) || name.includes(q);
      })
      .slice(0, 6);
  }, [text, people, recipients]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(value: string) {
    if (onAdd(value)) setText("");
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (open && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        commit(suggestions[active].email);
        return;
      }
    }
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
      if (text.trim()) {
        e.preventDefault();
        commit(text);
      }
    } else if (e.key === "Backspace" && !text && recipients.length) {
      onRemove(recipients[recipients.length - 1]);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="text-sm font-medium">To</label>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-card px-2 py-1.5 focus-within:border-foreground">
        {recipients.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs"
          >
            {email}
            <button
              onClick={() => onRemove(email)}
              className="text-muted hover:text-red-600"
              aria-label={`Remove ${email}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          className="min-w-40 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
          value={text}
          placeholder={recipients.length ? "" : "Type an email and press Enter…"}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Add a typed-but-uncommitted address when leaving the field.
            if (text.trim() && !open) commit(text);
          }}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-card shadow-lg">
          {suggestions.map((p, i) => {
            const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
            return (
              <li key={p.email}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(p.email);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cx(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                    i === active ? "bg-subtle" : "hover:bg-subtle/60"
                  )}
                >
                  {name && <span className="font-medium">{name}</span>}
                  <span className="text-muted">{p.email}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
