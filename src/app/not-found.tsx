import Link from "next/link";
import type { Metadata } from "next";
import { NotFoundArcade } from "@/components/NotFoundArcade";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Minimal black-and-white desert line-art wrapped around a big 404 — a nod to
// the original site's 404, redrawn on-brand. Uses currentColor so it inverts
// cleanly in dark mode.
function DesertScene() {
  return (
    <svg
      viewBox="0 0 760 300"
      className="mx-auto h-auto w-full max-w-2xl text-foreground"
      role="img"
      aria-label="A desert scene with cacti flanking a large 404"
      fill="none"
    >
      {/* clouds */}
      <g
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      >
        <path d="M250 60c6-14 26-13 30 0 12-3 18 9 8 14h-42c-9-3-8-13 4-14Z" />
        <path d="M330 40c5-12 22-11 26 0 10-2 15 8 7 12h-36c-8-2-7-11 3-12Z" />
      </g>

      {/* saguaro cactus, left */}
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M120 230V120a10 10 0 0 1 20 0v110" />
        <path d="M120 175h-16a8 8 0 0 0-8 8v22" />
        <path d="M140 160h16a8 8 0 0 1 8 8v30" />
      </g>
      {/* dotted texture on trunk */}
      <g fill="currentColor" opacity="0.45">
        <circle cx="130" cy="140" r="1.6" />
        <circle cx="130" cy="158" r="1.6" />
        <circle cx="130" cy="176" r="1.6" />
        <circle cx="130" cy="194" r="1.6" />
        <circle cx="130" cy="212" r="1.6" />
      </g>

      {/* prickly-pear cactus, right */}
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="650" cy="212" rx="30" ry="24" />
        <ellipse cx="672" cy="176" rx="20" ry="24" transform="rotate(18 672 176)" />
        <ellipse cx="628" cy="168" rx="15" ry="18" transform="rotate(-16 628 168)" />
      </g>
      <g fill="currentColor" opacity="0.4">
        <circle cx="644" cy="205" r="1.6" />
        <circle cx="656" cy="214" r="1.6" />
        <circle cx="650" cy="222" r="1.6" />
        <circle cx="670" cy="176" r="1.6" />
        <circle cx="626" cy="166" r="1.6" />
      </g>

      {/* the 404 */}
      <text
        x="380"
        y="215"
        textAnchor="middle"
        fill="currentColor"
        fontSize="180"
        fontWeight="700"
        fontFamily="var(--font-display, Georgia, serif)"
        letterSpacing="-6"
      >
        404
      </text>

      {/* dashed ground with little footprints */}
      <g
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
        strokeDasharray="14 12"
      >
        <line x1="70" y1="234" x2="690" y2="234" />
      </g>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M300 244v6M296 250h8M304 250h4" />
        <path d="M430 244v6M426 250h8M434 250h4" />
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <DesertScene />

      <h1 className="mt-6 font-display text-2xl font-semibold">
        Looks like this page wandered off into the desert.
      </h1>
      <p className="mt-3 max-w-md font-serif text-lg leading-relaxed text-muted">
        The link you followed doesn&apos;t exist (anymore). No pressure — pass
        the time with a quick game while you decide where to head next.
      </p>

      <div className="mt-8 w-full max-w-xl">
        <NotFoundArcade />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
        >
          Back to homepage
        </Link>
        <Link
          href="/writings"
          className="rounded-md border border-line px-4 py-2 hover:bg-subtle"
        >
          Read the writings
        </Link>
      </div>
    </main>
  );
}
