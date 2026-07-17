"use client";

import { useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to send");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  const input =
    "h-11 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground";

  if (status === "done") {
    return (
      <div className="rounded-md border border-line bg-subtle/60 p-6">
        <p className="font-display text-xl">Thank you.</p>
        <p className="mt-2 text-sm text-muted">
          Your message reached Audarya. You&apos;ll hear back soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className={input}
          placeholder="Name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <input
          className={input}
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>
      <input
        className={input}
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
      />
      <textarea
        className="min-h-32 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground"
        placeholder="Your message"
        required
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
      />
      {status === "error" && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
