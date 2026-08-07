import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIpFrom, geoFromTimezone, lookupGeo, type Geo } from "@/lib/geo";

export const runtime = "nodejs";

// Search engines whose referrals count as "organic" traffic.
const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "yahoo.",
  "duckduckgo.",
  "baidu.",
  "yandex.",
  "ecosia.",
  "brave.",
  "startpage.",
  "ask.com",
];

// Social networks whose referrals count as "social" traffic.
const SOCIAL_HOSTS = [
  "facebook.",
  "fb.",
  "instagram.",
  "t.co",
  "twitter.",
  "x.com",
  "linkedin.",
  "lnkd.in",
  "youtube.",
  "youtu.be",
  "reddit.",
  "pinterest.",
  "whatsapp.",
  "wa.me",
  "t.me",
  "telegram.",
  "threads.",
  "tumblr.",
  "quora.",
  "medium.",
];

function classifySource(referrerHost: string, ownHost: string): string {
  if (!referrerHost) return "direct";
  if (ownHost && referrerHost.endsWith(ownHost)) return "internal";
  if (SEARCH_HOSTS.some((h) => referrerHost.includes(h))) return "organic";
  if (SOCIAL_HOSTS.some((h) => referrerHost.includes(h))) return "social";
  return "referral";
}

function classifyDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(s))
    return "mobile";
  return "desktop";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = String(body.vid || "").slice(0, 64);
    const sessionId = String(body.sid || "").slice(0, 64);
    if (!visitorId || !sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const newSession = Boolean(body.newSession);
    const path = String(body.path || "/").slice(0, 512);
    const referrer = String(body.referrer || "");
    const referrerHost = referrer ? hostOf(referrer) : "";

    const ua = req.headers.get("user-agent") || "";
    const ownHost = hostOf(`https://${req.headers.get("host") || ""}`);
    const source = classifySource(referrerHost, ownHost);
    const device = classifyDevice(ua);

    const tz = String(body.tz || "").slice(0, 64);
    let geo: Geo = await lookupGeo(clientIpFrom(req.headers));
    if (!geo.country && tz) geo = geoFromTimezone(tz);

    // Upsert the visitor. If they didn't exist, this is a brand-new visitor.
    const existing = await prisma.visitor.findUnique({
      where: { id: visitorId },
      select: { id: true },
    });
    const isNewVisitor = !existing;

    if (isNewVisitor) {
      await prisma.visitor.create({
        data: { id: visitorId, sessionCount: 1 },
      });
    } else {
      await prisma.visitor.update({
        where: { id: visitorId },
        data: {
          lastSeen: new Date(),
          ...(newSession ? { sessionCount: { increment: 1 } } : {}),
        },
      });
    }

    await prisma.pageView.create({
      data: {
        visitorId,
        sessionId,
        path,
        referrerHost: source === "internal" ? "" : referrerHost,
        source,
        device,
        isNewVisitor,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
