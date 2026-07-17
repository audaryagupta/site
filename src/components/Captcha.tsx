"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

export interface CaptchaValue {
  token: string;
  answer: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: string;
        }
      ) => string;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Captcha({
  onChange,
}: {
  onChange: (v: CaptchaValue) => void;
}) {
  const useTurnstile = Boolean(SITE_KEY);
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [question, setQuestion] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");

  // Fallback challenge: fetch a math question + signed token.
  useEffect(() => {
    if (useTurnstile) return;
    fetch("/api/captcha")
      .then((r) => r.json())
      .then((d) => {
        if (d.mode === "fallback") {
          setQuestion(d.question);
          setToken(d.token);
        }
      })
      .catch(() => {});
  }, [useTurnstile]);

  // Turnstile widget.
  useEffect(() => {
    if (!useTurnstile || rendered.current) return;
    const id = "cf-turnstile-script";
    function renderWidget() {
      if (!widgetRef.current || !window.turnstile || rendered.current) return;
      rendered.current = true;
      window.turnstile.render(widgetRef.current, {
        sitekey: SITE_KEY!,
        callback: (t: string) => {
          setToken(t);
          onChange({ token: t, answer: "turnstile" });
        },
        "expired-callback": () => {
          setToken("");
          onChange({ token: "", answer: "" });
        },
      });
    }
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = renderWidget;
      document.head.appendChild(s);
    } else {
      renderWidget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTurnstile]);

  if (useTurnstile) {
    return <div ref={widgetRef} className="min-h-[65px]" />;
  }

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
        <ShieldCheck size={13} /> Verify you&apos;re human
      </label>
      <div className="flex items-center gap-3">
        <span className="text-sm">{question || "Loading…"}</span>
        <input
          className="h-11 w-24 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
          inputMode="numeric"
          placeholder="?"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            onChange({ token, answer: e.target.value });
          }}
        />
      </div>
    </div>
  );
}
