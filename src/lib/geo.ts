// Coarse IP -> location lookup for first-party analytics. We never persist the
// raw IP; only the derived country / region / city are stored. Results are
// cached in-memory per server instance to avoid repeat external calls, and the
// lookup fails open (blank location) so tracking never blocks a page view.

export interface Geo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
}

const EMPTY: Geo = { country: "", countryCode: "", region: "", city: "" };

// Small fallback so at least the country resolves when IP geo is unavailable
// (e.g. network egress blocked). Derived from the browser's IANA timezone.
const TZ_COUNTRY: Record<string, [string, string]> = {
  "Asia/Kolkata": ["India", "IN"],
  "Asia/Calcutta": ["India", "IN"],
  "Asia/Dhaka": ["Bangladesh", "BD"],
  "Asia/Karachi": ["Pakistan", "PK"],
  "Asia/Kathmandu": ["Nepal", "NP"],
  "Asia/Colombo": ["Sri Lanka", "LK"],
  "Asia/Dubai": ["United Arab Emirates", "AE"],
  "Asia/Singapore": ["Singapore", "SG"],
  "Asia/Tokyo": ["Japan", "JP"],
  "Asia/Shanghai": ["China", "CN"],
  "Asia/Hong_Kong": ["Hong Kong", "HK"],
  "Europe/London": ["United Kingdom", "GB"],
  "Europe/Paris": ["France", "FR"],
  "Europe/Berlin": ["Germany", "DE"],
  "Europe/Madrid": ["Spain", "ES"],
  "Europe/Amsterdam": ["Netherlands", "NL"],
  "America/New_York": ["United States", "US"],
  "America/Chicago": ["United States", "US"],
  "America/Los_Angeles": ["United States", "US"],
  "America/Toronto": ["Canada", "CA"],
  "Australia/Sydney": ["Australia", "AU"],
};

export function geoFromTimezone(tz: string): Geo {
  const hit = TZ_COUNTRY[tz];
  if (!hit) return EMPTY;
  return { country: hit[0], countryCode: hit[1], region: "", city: "" };
}

const cache = new Map<string, Geo>();

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip.startsWith("127.") || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80"))
    return true;
  return false;
}

export function clientIpFrom(headers: Headers): string {
  const fly = headers.get("fly-client-ip");
  if (fly) return fly.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (headers.get("x-real-ip") || "").trim();
}

export async function lookupGeo(ip: string): Promise<Geo> {
  if (isPrivateIp(ip)) return EMPTY;
  const cached = cache.get(ip);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    // ipwho.is: free, keyless, HTTPS. Fails open on any error.
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    const data = (await res.json().catch(() => null)) as
      | {
          success?: boolean;
          country?: string;
          country_code?: string;
          region?: string;
          city?: string;
        }
      | null;
    if (!data || data.success === false) return EMPTY;
    const geo: Geo = {
      country: String(data.country || "").slice(0, 80),
      countryCode: String(data.country_code || "").slice(0, 4),
      region: String(data.region || "").slice(0, 80),
      city: String(data.city || "").slice(0, 80),
    };
    cache.set(ip, geo);
    return geo;
  } catch {
    return EMPTY;
  }
}
