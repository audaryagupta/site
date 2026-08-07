import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = {
  "7": 7,
  "30": 30,
  "90": 90,
  "365": 365,
};

interface PV {
  sessionId: string;
  visitorId: string;
  path: string;
  referrerHost: string;
  source: string;
  device: string;
  isNewVisitor: boolean;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  createdAt: Date;
}

export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;

  const url = new URL(req.url);
  const rangeKey = url.searchParams.get("range") || "30";
  const days = RANGES[rangeKey] || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = (await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: {
      sessionId: true,
      visitorId: true,
      path: true,
      referrerHost: true,
      source: true,
      device: true,
      isNewVisitor: true,
      country: true,
      countryCode: true,
      region: true,
      city: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })) as PV[];

  const pageviews = rows.length;
  const sessions = new Set(rows.map((r) => r.sessionId));
  const visitors = new Set(rows.map((r) => r.visitorId));

  // New visitors in the range (their very first visit landed in this window).
  const newVisitors = await prisma.visitor.count({
    where: { firstSeen: { gte: since } },
  });
  const totalVisitorsAllTime = await prisma.visitor.count();

  // Session duration + pages/session, grouped by session.
  const bySession = new Map<string, { first: number; last: number; count: number }>();
  for (const r of rows) {
    const t = r.createdAt.getTime();
    const s = bySession.get(r.sessionId);
    if (!s) bySession.set(r.sessionId, { first: t, last: t, count: 1 });
    else {
      s.last = Math.max(s.last, t);
      s.first = Math.min(s.first, t);
      s.count += 1;
    }
  }
  let durSum = 0;
  let durCount = 0;
  Array.from(bySession.values()).forEach((s) => {
    const secs = Math.round((s.last - s.first) / 1000);
    if (secs > 0 && secs < 60 * 60 * 2) {
      durSum += secs;
      durCount += 1;
    }
  });
  const avgSessionSeconds = durCount ? Math.round(durSum / durCount) : 0;
  const pagesPerSession = sessions.size
    ? Math.round((pageviews / sessions.size) * 10) / 10
    : 0;
  const bounceCount = Array.from(bySession.values()).filter(
    (s) => s.count === 1
  ).length;
  const bounceRate = sessions.size
    ? Math.round((bounceCount / sessions.size) * 100)
    : 0;

  // Returning vs new sessions (based on whether the pageview flagged a new visitor).
  const repeatVisitors = Math.max(0, visitors.size - countNewVisitorsInRows(rows));

  // Breakdowns by unique sessions where possible.
  const sourceSessions = groupSessions(rows, (r) => r.source || "direct");
  const deviceSessions = groupSessions(rows, (r) => r.device || "desktop");
  const topPages = topBy(rows, (r) => r.path).slice(0, 12);
  const topReferrers = topBy(
    rows.filter((r) => r.referrerHost),
    (r) => r.referrerHost
  ).slice(0, 12);

  // Geography — distinct sessions per country / city.
  const countries = groupSessionsMeta(
    rows,
    (r) => r.country || "Unknown",
    (r) => ({ code: r.countryCode })
  ).slice(0, 12);
  const cities = groupSessionsMeta(
    rows.filter((r) => r.city),
    (r) => r.city,
    (r) => ({ code: r.countryCode, country: r.country, region: r.region })
  ).slice(0, 12);

  // Average sessions by weekday (IST), Sun..Sat.
  const byDayOfWeek = weekdayAverages(bySession, days);

  // Monthly trend for the last 12 months (independent of the selected range).
  const monthly = await monthlyTrend();

  // Sessions over time — daily for <=90 days, monthly for the 12-month range.
  const series =
    days <= 90
      ? dailySeries(rows, bySession, days)
      : monthly.map((m) => ({
          label: m.label,
          date: m.month,
          sessions: m.sessions,
          pageviews: m.pageviews,
        }));

  return NextResponse.json({
    range: days,
    summary: {
      pageviews,
      sessions: sessions.size,
      uniqueVisitors: visitors.size,
      newVisitors,
      repeatVisitors,
      returningRate: visitors.size
        ? Math.round((repeatVisitors / visitors.size) * 100)
        : 0,
      avgSessionSeconds,
      pagesPerSession,
      bounceRate,
      totalVisitorsAllTime,
    },
    sources: sourceSessions,
    devices: deviceSessions,
    topPages,
    topReferrers,
    countries,
    cities,
    series,
    byDayOfWeek,
    monthly,
  });
}

function countNewVisitorsInRows(rows: PV[]): number {
  const s = new Set<string>();
  for (const r of rows) if (r.isNewVisitor) s.add(r.visitorId);
  return s.size;
}

// Count distinct sessions per key (so multiple pageviews in one visit count once).
function groupSessions(
  rows: PV[],
  keyFn: (r: PV) => string
): { key: string; sessions: number }[] {
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, new Set());
    map.get(k)!.add(r.sessionId);
  }
  return Array.from(map.entries())
    .map(([key, set]) => ({ key, sessions: set.size }))
    .sort((a, b) => b.sessions - a.sessions);
}

// Distinct sessions per key, carrying extra metadata (country code, etc.)
// taken from the first row seen for that key.
function groupSessionsMeta(
  rows: PV[],
  keyFn: (r: PV) => string,
  metaFn: (r: PV) => Record<string, string | undefined>
): { key: string; sessions: number; meta: Record<string, string | undefined> }[] {
  const map = new Map<
    string,
    { set: Set<string>; meta: Record<string, string | undefined> }
  >();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, { set: new Set(), meta: metaFn(r) });
    map.get(k)!.set.add(r.sessionId);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, sessions: v.set.size, meta: v.meta }))
    .sort((a, b) => b.sessions - a.sessions);
}

// IST day key (YYYY-MM-DD) for a timestamp.
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kolkata",
});
const dayLabelFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  timeZone: "Asia/Kolkata",
});

// Sessions & page views per IST day across the selected window.
function dailySeries(
  rows: PV[],
  bySession: Map<string, { first: number; last: number; count: number }>,
  days: number
): { label: string; date: string; sessions: number; pageviews: number }[] {
  const buckets = new Map<
    string,
    { label: string; sessions: number; pageviews: number }
  >();
  const cursor = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  for (let i = 0; i < days; i++) {
    const key = dayKeyFmt.format(cursor);
    buckets.set(key, { label: dayLabelFmt.format(cursor), sessions: 0, pageviews: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  // Page views by day.
  for (const r of rows) {
    const b = buckets.get(dayKeyFmt.format(r.createdAt));
    if (b) b.pageviews += 1;
  }
  // Sessions counted on the day they started.
  Array.from(bySession.values()).forEach((s) => {
    const b = buckets.get(dayKeyFmt.format(new Date(s.first)));
    if (b) b.sessions += 1;
  });
  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    label: b.label,
    sessions: b.sessions,
    pageviews: b.pageviews,
  }));
}

const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "Asia/Kolkata",
});
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Average sessions per weekday across the window (total sessions on that
// weekday / number of that weekday's dates in the window).
function weekdayAverages(
  bySession: Map<string, { first: number; last: number; count: number }>,
  days: number
): { day: string; avg: number; total: number }[] {
  const totals: Record<string, number> = {};
  const occurrences: Record<string, number> = {};
  for (const d of WEEKDAYS) {
    totals[d] = 0;
    occurrences[d] = 0;
  }
  const cursor = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  for (let i = 0; i < days; i++) {
    occurrences[weekdayFmt.format(cursor)] += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  Array.from(bySession.values()).forEach((s) => {
    totals[weekdayFmt.format(new Date(s.first))] += 1;
  });
  return WEEKDAYS.map((day) => ({
    day,
    total: totals[day],
    avg: occurrences[day]
      ? Math.round((totals[day] / occurrences[day]) * 10) / 10
      : 0,
  }));
}

function topBy(
  rows: PV[],
  keyFn: (r: PV) => string
): { key: string; views: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, views]) => ({ key, views }))
    .sort((a, b) => b.views - a.views);
}

async function monthlyTrend() {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const rows = (await prisma.pageView.findMany({
    where: { createdAt: { gte: start } },
    select: { sessionId: true, createdAt: true, isNewVisitor: true, visitorId: true },
    orderBy: { createdAt: "asc" },
  })) as Pick<PV, "sessionId" | "createdAt" | "isNewVisitor" | "visitorId">[];

  // Build the 12 month buckets (labelled in IST).
  const buckets: {
    month: string;
    label: string;
    pageviews: number;
    _sessions: Set<string>;
    _newVisitors: Set<string>;
  }[] = [];
  const fmt = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const keyFmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const cursor = new Date(start);
  for (let i = 0; i < 12; i++) {
    const key = keyFmt.format(cursor).slice(0, 7);
    buckets.push({
      month: key,
      label: fmt.format(cursor),
      pageviews: 0,
      _sessions: new Set(),
      _newVisitors: new Set(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const byKey = new Map(buckets.map((b) => [b.month, b]));

  for (const r of rows) {
    const key = keyFmt.format(r.createdAt).slice(0, 7);
    const b = byKey.get(key);
    if (!b) continue;
    b.pageviews += 1;
    b._sessions.add(r.sessionId);
    if (r.isNewVisitor) b._newVisitors.add(r.visitorId);
  }

  return buckets.map((b) => ({
    month: b.month,
    label: b.label,
    pageviews: b.pageviews,
    sessions: b._sessions.size,
    newVisitors: b._newVisitors.size,
  }));
}
