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
    // recaptcha.net is served from the same infra as google.com/recaptcha but
    // is reachable on networks/regions where google.com is blocked or filtered.
    src: "https://www.recaptcha.net/recaptcha/api.js?render=explicit",
    global: "grecaptcha" as const,
    id: "g-recaptcha-script",
  },
  turnstile: {
    src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    global: "turnstile" as const,
    id: "cf-turnstile-script",
  },
};

// If the third-party widget can't load/render within this window, fall back to
// the built-in signed challenge so the form is never left unsubmittable.
const LOAD_TIMEOUT_MS = 7000;

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

  // Render the reCAPTCHA / Turnstile widget once its script is ready, falling
  // back to the built-in challenge if it can't load/render or errors.
  useEffect(() => {
    if (!config || config.mode === "fallback" || rendered.current) return;
    const p = PROVIDERS[config.mode];
    const sitekey = config.sitekey;

    function switchToFallback() {
      onChange({ token: "", answer: "" });
      fetch("/api/captcha?fallback=1")
        .then((r) => r.json())
        .then((d: Config) => {
          rendered.current = false;
          setConfig(d);
        })
        .catch(() => {});
    }

    function tryRender() {
      const api = window[p.global];
      if (!widgetRef.current || !api || rendered.current) return false;
      rendered.current = true;
      api.render(widgetRef.current, {
        sitekey,
        callback: (t: string) => onChange({ token: t, answer: config!.mode }),
        "expired-callback": () => onChange({ token: "", answer: "" }),
        "error-callback": switchToFallback,
      });
      return true;
    }

    if (!document.getElementById(p.id)) {
      const s = document.createElement("script");
      s.id = p.id;
      s.src = p.src;
      s.async = true;
      s.defer = true;
      s.onerror = switchToFallback;
      document.head.appendChild(s);
    }
    if (tryRender()) return;
    // Poll until the provider's API attaches (script load timing varies).
    const timer = setInterval(() => {
      if (tryRender()) clearInterval(timer);
    }, 200);
    // If it never attaches (blocked/unreachable), switch to the fallback.
    const timeout = setTimeout(() => {
      if (!rendered.current) {
        clearInterval(timer);
        switchToFallback();
      }
    }, LOAD_TIMEOUT_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
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
