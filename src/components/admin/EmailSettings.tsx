"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Send, Upload } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { cx } from "@/lib/utils";
import { TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/timezones";

interface Conn {
  connected: boolean;
  email: string;
}

const SIG_DEFAULT = `<p><strong>Audarya Gupta</strong><br/>The personal blog of Audarya Gupta<br/><a href="https://www.byaudarya.com">byaudarya.com</a></p>`;

export function EmailSettings() {
  const params = useSearchParams();
  const [mass, setMass] = useState<Conn>({ connected: false, email: "" });
  const [personal, setPersonal] = useState<Conn>({ connected: false, email: "" });
  const [signature, setSignature] = useState("");
  const [banner, setBanner] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadStatus() {
    const [gm, st] = await Promise.all([
      fetch("/api/admin/gmail").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setMass(gm.mass || { connected: false, email: "" });
    setPersonal(gm.personal || { connected: false, email: "" });
    const s = st.settings || {};
    setSignature(s.email_signature_html || SIG_DEFAULT);
    setBanner(s.email_banner_url || "");
    setTimezone(s.site_timezone || DEFAULT_TIMEZONE);
    setLoading(false);
  }
  useEffect(() => {
    loadStatus();
  }, []);

  const connectMsg =
    params.get("gmail") === "connected"
      ? `Connected ${params.get("email") || ""} as the ${
          params.get("role") === "personal" ? "personal" : "no-reply"
        } sender.`
      : params.get("gmail") === "error"
      ? `Google error: ${params.get("detail") || "unknown"}`
      : "";

  async function disconnect(role: "mass" | "personal") {
    if (!confirm("Disconnect this mailbox?")) return;
    await fetch(`/api/admin/gmail?role=${role}`, { method: "DELETE" });
    loadStatus();
  }

  async function uploadBanner(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "image");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setBanner(data.url);
    else alert(data.error || "Upload failed");
  }

  async function save() {
    setSaving(true);
    setSavedMsg("");
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          email_signature_html: signature,
          email_banner_url: banner,
          site_timezone: timezone,
        },
      }),
    });
    setSaving(false);
    setSavedMsg("Saved — used on composed/greeting mail, scheduling & calendar.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  if (loading) return <p className="mt-6 text-muted">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-10">
      {connectMsg && (
        <div
          className={cx(
            "rounded-md border px-4 py-3 text-sm",
            params.get("gmail") === "connected"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          )}
        >
          {connectMsg}
        </div>
      )}

      {/* Sending mailboxes */}
      <section>
        <h2 className="font-display text-lg font-semibold">Sending mailboxes</h2>
        <p className="mt-1 text-sm text-muted">
          Connect each Google mailbox once. No passwords — you sign in and grant
          send permission. Mass/no-reply mail (newsletters, digests) sends from
          the first; anything you send deliberately (the composer, birthday
          greetings) sends from the second.
        </p>

        <MailboxCard
          title="No-reply / bulk sender"
          hint="Recommended: mail@byaudarya.com"
          role="mass"
          conn={mass}
          onDisconnect={() => disconnect("mass")}
        />
        <MailboxCard
          title="Personal sender"
          hint="Recommended: audarya@byaudarya.com"
          role="personal"
          conn={personal}
          onDisconnect={() => disconnect("personal")}
        />
      </section>

      {/* Banner */}
      <section>
        <h2 className="font-display text-lg font-semibold">Email banner</h2>
        <p className="mt-1 text-sm text-muted">
          A header image shown at the top of composed &amp; greeting emails.
          Wide images work best (e.g. 1200×300).
        </p>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt="Email banner"
            className="mt-4 w-full max-w-lg rounded-lg border border-line"
          />
        )}
        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadBanner(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle"
          >
            <Upload size={15} /> {banner ? "Replace banner" : "Upload banner"}
          </button>
          {banner && (
            <button
              type="button"
              onClick={() => setBanner("")}
              className="text-sm text-muted hover:text-foreground"
            >
              Remove
            </button>
          )}
        </div>
      </section>

      {/* Signature */}
      <section>
        <h2 className="font-display text-lg font-semibold">Signature</h2>
        <p className="mt-1 text-sm text-muted">
          Appended to the bottom of composed &amp; greeting emails. Bold, add
          links, and format as you like.
        </p>
        <div className="mt-3">
          <RichTextEditor
            value={signature}
            onChange={setSignature}
            minHeight={160}
            placeholder="Your name, title, links…"
          />
        </div>
      </section>

      {/* Time zone */}
      <section>
        <h2 className="font-display text-lg font-semibold">Time zone</h2>
        <p className="mt-1 text-sm text-muted">
          Your preferred region. Scheduled emails send at this local time and
          your calendar is shown in it. Defaults to India (IST).
        </p>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-3 w-full max-w-sm rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          <Send size={15} /> {saving ? "Saving…" : "Save banner & signature"}
        </button>
        {savedMsg && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 size={15} /> {savedMsg}
          </span>
        )}
      </div>
    </div>
  );
}

function MailboxCard({
  title,
  hint,
  role,
  conn,
  onDisconnect,
}: {
  title: string;
  hint: string;
  role: "mass" | "personal";
  conn: Conn;
  onDisconnect: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-card p-5">
      <div>
        <p className="flex items-center gap-2 font-medium">
          <Mail size={16} /> {title}
        </p>
        {conn.connected ? (
          <p className="mt-1 text-sm text-green-700">
            Connected: {conn.email || "(address hidden)"}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">{hint}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`/api/admin/gmail/connect?role=${role}`}
          className="rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle"
        >
          {conn.connected ? "Reconnect" : "Connect with Google"}
        </a>
        {conn.connected && (
          <button
            onClick={onDisconnect}
            className="text-sm text-muted hover:text-red-600"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
