"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Fires a lightweight page-view beacon on each navigation. A first-party
// visitor id (localStorage) powers new-vs-repeat stats; a session id
// (sessionStorage) groups views into sessions for average-session-time.
function id() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
      return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function VisitTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    // Skip Studio/admin routes — those aren't public traffic.
    if (pathname.startsWith("/admin")) return;
    try {
      let vid = localStorage.getItem("bya_vid");
      if (!vid) {
        vid = id();
        localStorage.setItem("bya_vid", vid);
      }
      let sid = sessionStorage.getItem("bya_sid");
      const newSession = !sid;
      if (!sid) {
        sid = id();
        sessionStorage.setItem("bya_sid", sid);
      }

      const payload = {
        vid,
        sid,
        newSession,
        path: pathname,
        referrer: document.referrer || "",
      };
      const url = "/api/track";
      const bodyStr = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([bodyStr], { type: "application/json" }));
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* analytics must never break the page */
    }
    // Re-run when the path or query changes.
  }, [pathname, search]);

  return null;
}
