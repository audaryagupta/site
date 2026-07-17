"use client";

import { useState } from "react";

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
      setMessage(data.message || "You're in. Watch for Friday's recap.");
      setFirstName("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  if (status === "done") {
    return (
      <p className="font-serif text-lg italic text-foreground">{message}</p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={compact ? "flex flex-col gap-2 sm:flex-row" : "space-y-3"}
    >
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        required
        className="h-11 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        required
        className="h-11 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 whitespace-nowrap rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500 sm:basis-full">{message}</p>
      )}
    </form>
  );
}
