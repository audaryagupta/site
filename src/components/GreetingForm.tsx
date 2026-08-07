"use client";

import { useState } from "react";
import { Check, Gift } from "lucide-react";
import { cx } from "@/lib/utils";

export function GreetingForm() {
  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    occasion: "birthday" as "birthday" | "anniversary",
    forName: "",
    onDate: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/greetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Could not send request");
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
      <div className="rounded-xl border border-line bg-subtle/60 p-6 text-center animate-fade-up">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-foreground">
          <Check size={22} />
        </div>
        <p className="mt-4 font-display text-2xl">Request received.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Lovely — I&apos;ll take it from here and send a little note their way.
          Thank you for spreading some joy.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        {(["birthday", "anniversary"] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => update("occasion", o)}
            className={cx(
              "flex-1 rounded-md border px-4 py-2.5 text-sm capitalize transition",
              form.occasion === o
                ? "border-foreground bg-foreground text-background"
                : "border-line hover:bg-subtle"
            )}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className={input}
          placeholder="Their name"
          value={form.forName}
          onChange={(e) => update("forName", e.target.value)}
        />
        <input
          type="date"
          className={input}
          value={form.onDate}
          onChange={(e) => update("onDate", e.target.value)}
        />
      </div>

      <textarea
        className="min-h-20 w-full rounded-md border border-line bg-background p-3 text-sm outline-none focus:border-foreground"
        placeholder="Anything I should mention? (optional)"
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className={input}
          placeholder="Your name"
          required
          value={form.requesterName}
          onChange={(e) => update("requesterName", e.target.value)}
        />
        <input
          type="email"
          className={input}
          placeholder="Your email"
          required
          value={form.requesterEmail}
          onChange={(e) => update("requesterEmail", e.target.value)}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        <Gift size={16} />
        {status === "loading" ? "Sending…" : "Send the request"}
      </button>
    </form>
  );
}
