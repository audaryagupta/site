"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { SubscribeForm } from "./SubscribeForm";

function useCountdown(target?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!target || now === null) return null;
  const ms = new Date(target).getTime() - now;
  if (isNaN(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function ComingSoon({ launchAt }: { launchAt?: string }) {
  const c = useCountdown(launchAt);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-fade-up">
        <Logo className="mx-auto h-12" />
      </div>

      <p className="mt-10 text-xs uppercase tracking-[0.3em] text-muted animate-fade-up">
        Coming soon
      </p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl animate-fade-up">
        A new home for the writing is on its way.
      </h1>
      <p className="mt-4 max-w-md text-muted animate-fade-up">
        Essays, dispatches and curiosities about the world and everything in
        it. Leave your email and you&apos;ll be the first to know when it goes
        live.
      </p>

      {c && (
        <div className="mt-10 flex items-center gap-4 animate-fade-up">
          {[
            { n: c.days, l: "days" },
            { n: c.hours, l: "hrs" },
            { n: c.minutes, l: "min" },
            { n: c.seconds, l: "sec" },
          ].map((u) => (
            <div key={u.l} className="min-w-16">
              <div className="font-display text-4xl font-semibold tabular-nums">
                {String(u.n).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted">
                {u.l}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 w-full max-w-md animate-fade-up">
        <SubscribeForm compact />
      </div>
    </div>
  );
}
