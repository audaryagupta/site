"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Send, Trash2, X } from "lucide-react";

interface Appt {
  id: string;
  name: string;
  email: string;
  phone: string;
  purpose: string;
  title: string;
  isGroup: boolean;
  guests: string;
  mode: string;
  requestedStart: string;
  requestedEnd: string;
  status: string;
  meetingLink: string | null;
  location: string | null;
}

interface CalendarItem {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
}

const EMPTY_INVITE = {
  name: "",
  email: "",
  title: "",
  isGroup: false,
  guests: [] as string[],
  mode: "meet",
  date: "",
  time: "",
  duration: 30,
  purpose: "",
  location: "",
};

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cities, setCities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Inline editing
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    title: "",
    isGroup: false,
    mode: "meet",
    location: "",
    date: "",
    time: "",
    duration: 30,
  });

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ ...EMPTY_INVITE });
  const [inviteMsg, setInviteMsg] = useState("");
  const [guestInput, setGuestInput] = useState("");

  function commitGuests(raw: string) {
    const parts = raw
      .split(/[,\s]+/)
      .map((p) => p.trim().toLowerCase())
      .filter((p) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
    if (!parts.length) return;
    setInvite((v) => ({
      ...v,
      guests: Array.from(new Set([...v.guests, ...parts])),
    }));
    setGuestInput("");
  }
  function removeGuest(email: string) {
    setInvite((v) => ({ ...v, guests: v.guests.filter((g) => g !== email) }));
  }

  // Calendar sync
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [calConfigured, setCalConfigured] = useState(false);
  const [writeId, setWriteId] = useState("");
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [calMsg, setCalMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppts(data.appointments || []);
    setLoading(false);
  }
  async function loadCalendars() {
    const res = await fetch("/api/admin/calendars");
    const data = await res.json();
    setCalConfigured(Boolean(data.configured));
    setCalendars(data.calendars || []);
    setWriteId(data.config?.writeId || "");
    setBusyIds(data.config?.busyIds || []);
  }
  useEffect(() => {
    load();
    loadCalendars();
  }, []);

  async function act(
    id: string,
    action: "accept" | "reject" | "cancel",
    force = false
  ) {
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

  function istParts(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const time = d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  }

  function startEdit(a: Appt) {
    const { date, time } = istParts(a.requestedStart);
    const duration = Math.round(
      (new Date(a.requestedEnd).getTime() -
        new Date(a.requestedStart).getTime()) /
        60000
    );
    setEditForm({
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      purpose: a.purpose || "",
      title: a.title || "",
      isGroup: a.isGroup || false,
      mode: a.mode,
      location: a.location || "",
      date,
      time,
      duration: duration || 30,
    });
    setEditing(a.id);
  }

  async function saveEdit(id: string) {
    setBusy(id + "edit");
    const start = new Date(`${editForm.date}T${editForm.time}:00+05:30`);
    const end = new Date(start.getTime() + Number(editForm.duration) * 60000);
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        purpose: editForm.purpose,
        title: editForm.title,
        isGroup: editForm.isGroup,
        mode: editForm.mode,
        location: editForm.location,
        requestedStart: start.toISOString(),
        requestedEnd: end.toISOString(),
      }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not save changes.");
      return;
    }
    setEditing(null);
    load();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy("invite");
    setInviteMsg("");
    // Fold in any email still typed in the guest box.
    const typed = guestInput
      .split(/[,\s]+/)
      .map((p) => p.trim().toLowerCase())
      .filter((p) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
    const guests = invite.isGroup
      ? Array.from(new Set([...invite.guests, ...typed]))
      : [];
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...invite,
        guests,
        duration: Number(invite.duration),
      }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setInviteMsg(data.error || "Could not send invite.");
      return;
    }
    if (data.warnings?.length) setInviteMsg(data.warnings.join(" "));
    else setInviteMsg("Invite sent.");
    setInvite({ ...EMPTY_INVITE });
    setGuestInput("");
    load();
  }

  async function saveCalendars() {
    setBusy("calsave");
    setCalMsg("");
    await fetch("/api/admin/calendars", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writeId, busyIds }),
    });
    setBusy(null);
    setCalMsg("Saved.");
    setTimeout(() => setCalMsg(""), 2500);
  }

  function toggleBusy(id: string) {
    setBusyIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  const pending = appts.filter((a) => a.status === "pending");
  const accepted = appts.filter((a) => a.status === "accepted");
  const others = appts.filter(
    (a) => a.status !== "pending" && a.status !== "accepted"
  );

  function fmt(iso: string) {
    return (
      new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }) + " IST"
    );
  }

  const input =
    "h-9 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  function modeLabel(m: string) {
    if (m === "physical") return "in person";
    if (m === "meet") return "Google Meet";
    return m;
  }

  function renderEditForm(id: string) {
    return (
      <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
        <input
          className={input}
          placeholder="Name"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
        />
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={editForm.email}
          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
        />
        <input
          className={input}
          placeholder="Phone"
          value={editForm.phone}
          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
        />
        <select
          className={input}
          value={editForm.mode}
          onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
        >
          <option value="meet">Google Meet</option>
          <option value="physical">In person</option>
        </select>
        <input
          className={input}
          placeholder="Meeting name (optional)"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.isGroup}
            onChange={(e) =>
              setEditForm({ ...editForm, isGroup: e.target.checked })
            }
          />
          Group meeting
        </label>
        <input
          className={input}
          type="date"
          value={editForm.date}
          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
        />
        <input
          className={input}
          type="time"
          value={editForm.time}
          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
        />
        <select
          className={input}
          value={editForm.duration}
          onChange={(e) =>
            setEditForm({ ...editForm, duration: Number(e.target.value) })
          }
        >
          {[15, 30, 60, 90].map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
        {editForm.mode === "physical" && (
          <input
            className={input}
            placeholder="Location / full address"
            value={editForm.location}
            onChange={(e) =>
              setEditForm({ ...editForm, location: e.target.value })
            }
          />
        )}
        <textarea
          className="min-h-16 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground sm:col-span-2"
          placeholder="Purpose / agenda"
          value={editForm.purpose}
          onChange={(e) =>
            setEditForm({ ...editForm, purpose: e.target.value })
          }
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <button
            onClick={() => saveEdit(id)}
            disabled={busy === id + "edit"}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy === id + "edit" ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={() => setEditing(null)}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-subtle"
          >
            Cancel
          </button>
          <span className="text-xs text-muted">
            If accepted, the calendar event & guest email update automatically.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Meetings</h1>
          <p className="mt-1 text-sm text-muted">
            Accept to auto-create the calendar event, generate a Google Meet
            link and email the guest. Reject to send a polite decline.
          </p>
        </div>
        <button
          onClick={() => setShowInvite((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Send size={15} /> Send an invite
        </button>
      </div>

      {/* Send-an-invite form */}
      {showInvite && (
        <form
          onSubmit={sendInvite}
          className="mt-5 rounded-lg border border-line bg-card p-5"
        >
          <h2 className="font-display text-lg font-semibold">Send an invite</h2>
          <p className="mt-1 text-sm text-muted">
            Creates a confirmed meeting with Audarya, generates a Google Meet
            link + calendar event, and emails the invitee.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className={input}
              placeholder="Invitee name"
              required
              value={invite.name}
              onChange={(e) => setInvite({ ...invite, name: e.target.value })}
            />
            <input
              className={input}
              type="email"
              placeholder="Invitee email"
              required
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            />
            <select
              className={input}
              value={invite.mode}
              onChange={(e) => setInvite({ ...invite, mode: e.target.value })}
            >
              <option value="meet">Google Meet</option>
              <option value="physical">In person</option>
            </select>
            <input
              className={input}
              placeholder="Meeting name (optional)"
              value={invite.title}
              onChange={(e) => setInvite({ ...invite, title: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={invite.isGroup}
                onChange={(e) =>
                  setInvite({ ...invite, isGroup: e.target.checked })
                }
              />
              Group meeting with Audarya
            </label>
            {invite.isGroup && (
              <div className="sm:col-span-2">
                <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                  Guests (add multiple)
                </span>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-background px-2 py-1.5">
                  {invite.guests.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs"
                    >
                      {g}
                      <button
                        type="button"
                        onClick={() => removeGuest(g)}
                        className="text-muted hover:text-foreground"
                        aria-label={`Remove ${g}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
                    placeholder="Add guest email, press Enter"
                    value={guestInput}
                    onChange={(e) => setGuestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === "," ||
                        e.key === " "
                      ) {
                        e.preventDefault();
                        commitGuests(guestInput);
                      } else if (
                        e.key === "Backspace" &&
                        !guestInput &&
                        invite.guests.length
                      ) {
                        removeGuest(invite.guests[invite.guests.length - 1]);
                      }
                    }}
                    onBlur={() => commitGuests(guestInput)}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Everyone here is added to the Google Calendar event & Meet
                  invite.
                </p>
              </div>
            )}
            <select
              className={input}
              value={invite.duration}
              onChange={(e) =>
                setInvite({ ...invite, duration: Number(e.target.value) })
              }
            >
              {[15, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
            <input
              className={input}
              type="date"
              required
              value={invite.date}
              onChange={(e) => setInvite({ ...invite, date: e.target.value })}
            />
            <input
              className={input}
              type="time"
              required
              value={invite.time}
              onChange={(e) => setInvite({ ...invite, time: e.target.value })}
            />
            {invite.mode === "physical" && (
              <input
                className={`${input} sm:col-span-2`}
                placeholder="Location / full address"
                value={invite.location}
                onChange={(e) =>
                  setInvite({ ...invite, location: e.target.value })
                }
              />
            )}
            <input
              className={`${input} sm:col-span-2`}
              placeholder="Purpose / agenda (optional)"
              value={invite.purpose}
              onChange={(e) =>
                setInvite({ ...invite, purpose: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy === "invite"}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              <Send size={15} />
              {busy === "invite" ? "Sending…" : "Send invite"}
            </button>
            {inviteMsg && <span className="text-sm text-muted">{inviteMsg}</span>}
          </div>
        </form>
      )}

      {/* Google Calendar sync */}
      <div className="mt-5 rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-lg font-semibold">
          Google Calendar sync
        </h2>
        {!calConfigured ? (
          <p className="mt-1 text-sm text-muted">
            Connect Google (set GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN) to
            choose which calendars to write to and check for conflicts.
          </p>
        ) : calendars.length === 0 ? (
          <p className="mt-1 text-sm text-muted">
            Connected, but no calendars were returned. Using{" "}
            <code>{writeId || "primary"}</code>.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                  Create events on
                </span>
                <select
                  className={input}
                  value={writeId}
                  onChange={(e) => setWriteId(e.target.value)}
                >
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? " (primary)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="mb-1 block text-xs uppercase tracking-widest text-muted">
                  Check these for conflicts / busy
                </span>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                  {calendars.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 rounded px-1 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={busyIds.includes(c.id)}
                        onChange={() => toggleBusy(c.id)}
                      />
                      {c.summary}
                      {c.primary ? " (primary)" : ""}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveCalendars}
                disabled={busy === "calsave"}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {busy === "calsave" ? "Saving…" : "Save calendar sync"}
              </button>
              {calMsg && <span className="text-sm text-muted">{calMsg}</span>}
            </div>
          </>
        )}
      </div>

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
                          {modeLabel(a.mode)}
                        </span>
                        {a.isGroup && (
                          <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                            group
                          </span>
                        )}
                      </p>
                      {a.title && (
                        <p className="mt-0.5 text-sm font-medium">{a.title}</p>
                      )}
                      <p className="mt-1 text-sm text-muted">
                        {a.email}
                        {a.phone ? ` · ${a.phone}` : ""}
                      </p>
                      {a.guests && (
                        <p className="mt-1 text-sm text-muted">
                          + {a.guests}
                        </p>
                      )}
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
                      <button
                        onClick={() =>
                          editing === a.id ? setEditing(null) : startEdit(a)
                        }
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle disabled:opacity-50"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                    </div>
                  </div>

                  {editing === a.id && renderEditForm(a.id)}

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
                          className={input}
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
                        className={input}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {accepted.length > 0 && (
            <>
              <h2 className="mb-3 mt-10 font-display text-lg font-semibold">
                Upcoming ({accepted.length})
              </h2>
              <div className="space-y-3">
                {accepted.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-line bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm">
                        <p className="font-medium">
                          {a.name}{" "}
                          <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                            {modeLabel(a.mode)}
                          </span>
                          {a.isGroup && (
                            <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                              group
                            </span>
                          )}
                        </p>
                        {a.title && (
                          <p className="mt-0.5 font-medium">{a.title}</p>
                        )}
                        <p className="mt-1 text-muted">{fmt(a.requestedStart)}</p>
                        {a.guests && (
                          <p className="mt-0.5 text-muted">+ {a.guests}</p>
                        )}
                        {a.location && (
                          <p className="mt-0.5 text-muted">📍 {a.location}</p>
                        )}
                        {a.meetingLink && (
                          <a
                            href={a.meetingLink}
                            className="mt-0.5 block truncate text-foreground hover:underline"
                          >
                            {a.meetingLink}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            editing === a.id ? setEditing(null) : startEdit(a)
                          }
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle disabled:opacity-50"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Cancel this meeting and notify the guest?"
                              )
                            )
                              act(a.id, "cancel");
                          }}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle disabled:opacity-50"
                        >
                          <Trash2 size={15} /> Cancel
                        </button>
                      </div>
                    </div>
                    {editing === a.id && renderEditForm(a.id)}
                  </div>
                ))}
              </div>
            </>
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
                        <td className="px-4 py-3 text-muted">
                          {modeLabel(a.mode)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted">{a.status}</span>
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
