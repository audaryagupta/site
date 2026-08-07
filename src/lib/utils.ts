import slugify from "slugify";

// All time-sensitive operations use Indian Standard Time.
export const TIMEZONE = "Asia/Kolkata";

export function makeSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true }).slice(0, 80);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE,
  });
}

/**
 * Format an instant in an arbitrary IANA timezone, appending a short zone
 * abbreviation. Used for requester-facing appointment emails so times read in
 * the visitor's own timezone (falls back to IST).
 */
export function formatDateTimeInTz(
  date: Date | string | null | undefined,
  timeZone: string = TIMEZONE
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const tz = timeZone || TIMEZONE;
  const main = d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  });
  let abbr = "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(d);
    abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch {
    /* ignore */
  }
  return abbr ? `${main} (${abbr})` : main;
}

export function estimateReadingMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function excerptFromHtml(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Escape user-supplied text before interpolating into email/HTML strings. */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * True only for a real, direct link to a source's own article page. Rejects
 * news aggregators (e.g. Google News), search-result pages and bare homepages
 * so readers always land on the actual source rather than a redirect or a
 * dead search. Returns the trimmed URL when valid, otherwise "".
 */
export function directArticleUrl(u?: string): string {
  const raw = (u || "").trim();
  if (!/^https?:\/\//i.test(raw)) return "";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "";
  }
  const host = parsed.hostname.toLowerCase();
  const bannedHosts = [
    "news.google.com",
    "google.com",
    "google.co.uk",
    "bing.com",
    "duckduckgo.com",
    "news.yahoo.com",
    "t.co",
    "lnkd.in",
  ];
  if (bannedHosts.some((h) => host === h || host.endsWith(`.${h}`))) return "";
  const path = parsed.pathname.toLowerCase();
  if (path.includes("/search") || parsed.search.includes("q=")) return "";
  const slug = path.replace(/\/+$/, "");
  return slug === "" || slug === "/" ? "" : raw;
}
