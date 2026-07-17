"use client";

import { useState } from "react";
import { Check, Link2, Linkedin } from "lucide-react";

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    (typeof window !== "undefined" ? window.location.origin : "") + path;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:bg-subtle hover:text-foreground";

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs uppercase tracking-widest text-muted">
        Share
      </span>
      <a
        className={btn}
        aria-label="Share on X"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(url)}`}
      >
        <XIcon size={15} />
      </a>
      <a
        className={btn}
        aria-label="Share on LinkedIn"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`}
      >
        <Linkedin size={15} />
      </a>
      <button className={btn} aria-label="Copy link" onClick={copy}>
        {copied ? <Check size={15} /> : <Link2 size={15} />}
      </button>
    </div>
  );
}
