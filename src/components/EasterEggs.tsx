"use client";

import { useEffect, useState } from "react";

/**
 * Subtle easter eggs:
 * 1) A friendly note in the browser console for the curious.
 * 2) The Konami code reveals a quiet quote toast.
 */
export function EasterEggs() {
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      "%cby AUDARYA",
      "font-size:22px;font-weight:700;letter-spacing:2px;"
    );
    // eslint-disable-next-line no-console
    console.log(
      "%cYou woke up on the right side of the bed to end up here. Say hi → audarya@venturebuz.com",
      "color:#888;font-style:italic;"
    );

    const seq = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let idx = 0;
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === seq[idx].toLowerCase()) {
        idx += 1;
        if (idx === seq.length) {
          setReveal(true);
          idx = 0;
          setTimeout(() => setReveal(false), 6000);
        }
      } else {
        idx = 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!reveal) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-full border border-line bg-card px-5 py-3 text-sm shadow-xl">
      ✦ &ldquo;Any information that leaves you becomes 2× more useful.&rdquo; — Audarya
    </div>
  );
}
