"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

export interface CaptchaValue {
  token: string;
  answer: string;
}

type RenderFn = (
  el: HTMLElement,
  opts: {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
    theme?: string;
  }
) => string;

declare global {
  interface Window {
    turnstile?: { render: RenderFn };
    grecaptcha?: { render: RenderFn };
  }
}

type Config =
  | { mode: "recaptcha" | "turnstile"; sitekey: string }
  | { mode: "fallback"; question: string; token: string }
  | null;

const PROVIDERS = {
  recaptcha: {
    src: "https://www.google.com/recaptcha/api.js?render=explicit",
    global: "grecaptcha" as const,
    id: "g-recaptcha-script",
  },
  turnstile: {
    src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    global: "turnstile" as const,
    id: "cf-turnstile-script",
  },
};

export function Captcha({
  onChange,
}: {
  onChange: (v: CaptchaValue) => void;
}) {
  const [config, setConfig] = useState<Config>(null);
  const [answer, setAnswer] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  // Resolve the active provider (+ site key or fallback challenge) from the server.
  useEffect(() => {
    fetch("/api/captcha")
      .then((r) => r.json())
      .then((d: Config) => setConfig(d))
      .catch(() => {});
  }, []);

  // Render the reCAPTCHA / Turnstile widget once its script is ready.
  useEffect(() => {
    if (!config || config.mode === "fallback" || rendered.current) return;
    const p = PROVIDERS[config.mode];
    const sitekey = config.sitekey;

    function tryRender() {
      const api = window[p.global];
      if (!widgetRef.current || !api || rendered.current) return false;
      rendered.current = true;
      api.render(widgetRef.current, {
        sitekey,
        callback: (t: string) => onChange({ token: t, answer: config!.mode }),
        "expired-callback": () => onChange({ token: "", answer: "" }),
        "error-callback": () => onChange({ token: "", answer: "" }),
      });
      return true;
    }

    if (!document.getElementById(p.id)) {
      const s = document.createElement("script");
      s.id = p.id;
      s.src = p.src;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    if (tryRender()) return;
    // Poll until the provider's API attaches (script load timing varies).
    const timer = setInterval(() => {
      if (tryRender()) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  if (config && config.mode !== "fallback") {
    return <div ref={widgetRef} className="min-h-[65px]" />;
  }

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
        <ShieldCheck size={13} /> Verify you&apos;re human
      </label>
      <div className="flex items-center gap-3">
        <span className="text-sm">
          {config?.mode === "fallback" ? config.question : "Loading…"}
        </span>
        <input
          className="h-11 w-24 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
          inputMode="numeric"
          placeholder="?"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            onChange({
              token: config?.mode === "fallback" ? config.token : "",
              answer: e.target.value,
            });
          }}
        />
      </div>
    </div>
  );
}
