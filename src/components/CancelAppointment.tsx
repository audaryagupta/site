"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export function CancelAppointment({ token }: { token: string }) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function cancel() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Could not cancel.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (!token) {
    return (
      <>
        <h1 className="font-display text-3xl font-semibold">
          Missing cancellation link
        </h1>
        <p className="mt-3 text-sm text-muted">
          This page needs the cancellation link from your confirmation email.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm underline underline-offset-4"
        >
          ← Back home
        </Link>
      </>
    );
  }

  if (status === "done") {
    return (
      <>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-foreground">
          <Check size={22} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold">
          Appointment cancelled
        </h1>
        <p className="mt-3 text-sm text-muted">
          Your appointment has been cancelled and removed from the calendar.
          Feel free to book another time whenever you like.
        </p>
        <Link
          href="/contact#book"
          className="mt-6 inline-block text-sm underline underline-offset-4"
        >
          Book another time →
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">
        Cancel your appointment?
      </h1>
      <p className="mt-3 text-sm text-muted">
        This will cancel your confirmed appointment and free up the slot. This
        can&apos;t be undone.
      </p>
      {status === "error" && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-500">
          <X size={14} /> {error}
        </p>
      )}
      <button
        onClick={cancel}
        disabled={status === "loading"}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Cancelling…" : "Yes, cancel it"}
      </button>
    </>
  );
}
