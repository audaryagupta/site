// Curated list of IANA time zones grouped by region, for the timezone picker.
// Keep the default first so it's the obvious choice.
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export interface TzOption {
  value: string;
  label: string;
}

export const TIMEZONES: TzOption[] = [
  { value: "Asia/Kolkata", label: "India — Kolkata (IST)" },
  { value: "Asia/Dubai", label: "UAE — Dubai (GST)" },
  { value: "Asia/Karachi", label: "Pakistan — Karachi (PKT)" },
  { value: "Asia/Dhaka", label: "Bangladesh — Dhaka (BST)" },
  { value: "Asia/Kathmandu", label: "Nepal — Kathmandu (NPT)" },
  { value: "Asia/Colombo", label: "Sri Lanka — Colombo" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "China — Shanghai (CST)" },
  { value: "Europe/London", label: "UK — London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe — Paris (CET)" },
  { value: "Europe/Berlin", label: "Germany — Berlin (CET)" },
  { value: "Europe/Moscow", label: "Russia — Moscow (MSK)" },
  { value: "America/New_York", label: "US Eastern — New York (ET)" },
  { value: "America/Chicago", label: "US Central — Chicago (CT)" },
  { value: "America/Denver", label: "US Mountain — Denver (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific — Los Angeles (PT)" },
  { value: "America/Sao_Paulo", label: "Brazil — São Paulo (BRT)" },
  { value: "Australia/Sydney", label: "Australia — Sydney (AET)" },
  { value: "Pacific/Auckland", label: "New Zealand — Auckland (NZT)" },
  { value: "UTC", label: "UTC" },
];

export function tzLabel(value: string): string {
  return TIMEZONES.find((t) => t.value === value)?.label || value;
}

/** Current UTC offset (minutes) for an IANA zone at a given instant. */
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  // Format the instant in the target zone, reparse as if UTC, and diff.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

/**
 * Convert a wall-clock "YYYY-MM-DDTHH:mm" (from a datetime-local input) that the
 * user means *in `timeZone`* into the correct absolute UTC Date.
 */
export function zonedWallTimeToUtc(local: string, timeZone: string): Date {
  // Interpret the string as if it were UTC first…
  const naive = new Date(`${local}:00.000Z`);
  if (Number.isNaN(naive.getTime())) return new Date(NaN);
  // …then subtract the zone's offset at that instant to get real UTC.
  const offset = tzOffsetMinutes(timeZone, naive);
  return new Date(naive.getTime() - offset * 60000);
}

/**
 * Inverse of `zonedWallTimeToUtc`: render an absolute instant as the
 * "YYYY-MM-DDTHH:mm" wall-clock string it maps to in `timeZone` — suitable for
 * pre-filling a `datetime-local` input.
 */
export function utcToZonedWallTime(iso: string | Date, timeZone: string): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}
