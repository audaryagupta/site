"use client";

import { useState } from "react";
import { KeyRound, LogIn } from "lucide-react";

// Discreet entry point to the private Studio. Clicking "Open sim-sim" reveals
// the sign-in link. When the Studio lives on its own subdomain we send people
// there; otherwise (preview / local) we use /admin on this host.
export function StudioEntry() {
  const [open, setOpen] = useState(false);
  const studioHost = process.env.NEXT_PUBLIC_STUDIO_HOST;
  const studioUrl = studioHost ? `https://${studioHost}/` : "/admin";

  return (
    <span className="inline-flex items-center gap-2">
      {open ? (
        <a
          href={studioUrl}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-foreground transition hover:bg-subtle"
        >
          <LogIn size={13} /> Sign in to Studio
        </a>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
        >
          <KeyRound size={13} /> Open sim-sim
        </button>
      )}
    </span>
  );
}
