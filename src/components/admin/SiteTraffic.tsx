"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Globe,
  MonitorSmartphone,
  Repeat,
  Users,
} from "lucide-react";

interface Summary {
  pageviews: number;
  sessions: number;
  uniqueVisitors: number;
  newVisitors: number;
  repeatVisitors: number;
  returningRate: number;
  avgSessionSeconds: number;
  pagesPerSession: number;
  bounceRate: number;
  totalVisitorsAllTime: number;
}
interface KeyCount {
  key: string;
  sessions: number;
}
interface KeyViews {
  key: string;
  views: number;
}
interface MonthRow {
  month: string;
  label: string;
  pageviews: number;
  sessions: number;
  newVisitors: number;
}
interface GeoRow {
  key: string;
  sessions: number;
  meta: { code?: string; country?: string; region?: string };
}
interface SeriesPoint {
  label: string;
  date: string;
  sessions: number;
  pageviews: number;
}
interface DayRow {
  day: string;
  avg: number;
  total: number;
}
interface Data {
  range: number;
  summary: Summary;
  sources: KeyCount[];
  devices: KeyCount[];
  topPages: KeyViews[];
  topReferrers: KeyViews[];
  countries: GeoRow[];
  cities: GeoRow[];
  series: SeriesPoint[];
  byDayOfWeek: DayRow[];
  monthly: MonthRow[];
}

// Turn an ISO country code (e.g. "IN") into its flag emoji.
function flag(code?: string): string {
  if (!code || code.length !== 2) return "";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  return String.fromCodePoint(
    A + (code.toUpperCase().charCodeAt(0) - base),
    A + (code.toUpperCase().charCodeAt(1) - base)
  );
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const RANGES = [
  { k: "7", label: "7 days" },
  { k: "30", label: "30 days" },
  { k: "90", label: "90 days" },
  { k: "365", label: "12 months" },
];
const SOURCE_LABEL: Record<string, string> = {
  organic: "Organic search",
  direct: "Direct",
  social: "Social",
  referral: "Referral",
  internal: "Internal",
};

function duration(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

export function SiteTraffic() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/site-analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setData(d);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  const maxMonthly = useMemo(
    () => Math.max(1, ...(data?.monthly.map((m) => m.pageviews) || [1])),
    [data]
  );

  const s = data?.summary;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Site traffic</h2>
          <p className="mt-1 text-sm text-muted">
            Real visits to the public site — no boosts here. First-party only, no
            third-party trackers.
          </p>
        </div>
        <div className="flex rounded-md border border-line bg-card p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.k}
              onClick={() => setRange(r.k)}
              className={
                "rounded px-3 py-1 text-xs font-medium transition " +
                (range === r.k
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : !s || s.pageviews === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-card p-8 text-center text-sm text-muted">
          No visits recorded in this window yet. Traffic starts logging as soon
          as visitors browse the public site.
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={<Activity size={15} />} label="Page views" value={fmt(s.pageviews)} />
            <Stat icon={<Users size={15} />} label="Visits (sessions)" value={fmt(s.sessions)} sub={`${fmt(s.pagesPerSession)} pages / visit`} />
            <Stat icon={<Globe size={15} />} label="Unique visitors" value={fmt(s.uniqueVisitors)} sub={`${fmt(s.totalVisitorsAllTime)} all-time`} />
            <Stat icon={<Repeat size={15} />} label="Returning" value={`${s.returningRate}%`} sub={`${fmt(s.newVisitors)} new · ${fmt(s.repeatVisitors)} repeat`} />
            <Stat icon={<Clock size={15} />} label="Avg. session" value={duration(s.avgSessionSeconds)} />
            <Stat icon={<Activity size={15} />} label="Bounce rate" value={`${s.bounceRate}%`} sub="single-page visits" />
          </div>

          {/* Sessions over time */}
          <div className="mt-6 rounded-lg border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Sessions over time</h3>
              <span className="text-xs text-muted">
                {data!.range <= 90 ? "daily" : "monthly"} · visits
              </span>
            </div>
            <TrendChart points={data!.series} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* New vs returning donut */}
            <Donut
              title="New vs returning"
              icon={<Repeat size={15} />}
              center={fmt(s.uniqueVisitors)}
              centerLabel="visitors"
              segments={[
                { label: "New", value: s.newVisitors },
                { label: "Returning", value: s.repeatVisitors },
              ]}
            />
            {/* Devices donut */}
            <Donut
              title="Sessions by device"
              icon={<MonitorSmartphone size={15} />}
              center={fmt(s.sessions)}
              centerLabel="visits"
              segments={data!.devices.map((d) => ({
                label: d.key.charAt(0).toUpperCase() + d.key.slice(1),
                value: d.sessions,
              }))}
            />
            {/* Avg sessions by weekday */}
            <div className="rounded-lg border border-line bg-card p-5">
              <h3 className="text-sm font-semibold">Avg. sessions by day</h3>
              <p className="text-xs text-muted">visits per weekday (IST)</p>
              <WeekdayChart rows={data!.byDayOfWeek} />
            </div>
          </div>

          {/* Geography */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Sessions by country"
              icon={<Globe size={15} />}
              rows={data!.countries.map((c) => ({
                label: `${flag(c.meta.code)} ${c.key}`.trim(),
                value: c.sessions,
              }))}
              unit="visits"
            />
            <TopList
              title="Top cities"
              rows={data!.cities.map((c) => ({
                label: `${flag(c.meta.code)} ${c.key}${
                  c.meta.region ? `, ${c.meta.region}` : ""
                }`.trim(),
                value: c.sessions,
              }))}
              empty="No city-level data yet — locations resolve as visitors arrive."
              unit="visits"
            />
          </div>

          {/* Monthly trend */}
          <div className="mt-6 rounded-lg border border-line bg-card p-5">
            <h3 className="text-sm font-semibold">Visitors by month</h3>
            <p className="text-xs text-muted">Last 12 months · page views</p>
            <div className="mt-5 flex h-44 items-end gap-2">
              {data!.monthly.map((m) => (
                <div
                  key={m.month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-[10px] text-muted">{m.pageviews || ""}</span>
                  <div
                    className="w-full rounded-t bg-foreground transition-all"
                    style={{ height: `${(m.pageviews / maxMonthly) * 88}%`, minHeight: m.pageviews ? 3 : 0 }}
                    title={`${m.label}: ${fmt(m.pageviews)} views, ${fmt(m.sessions)} visits, ${fmt(m.newVisitors)} new`}
                  />
                  <span className="text-[10px] text-muted">{m.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Traffic sources"
              icon={<Globe size={15} />}
              rows={data!.sources.map((x) => ({
                label: SOURCE_LABEL[x.key] || x.key,
                value: x.sessions,
              }))}
              unit="visits"
            />
            <Breakdown
              title="Devices"
              icon={<MonitorSmartphone size={15} />}
              rows={data!.devices.map((x) => ({
                label: x.key.charAt(0).toUpperCase() + x.key.slice(1),
                value: x.sessions,
              }))}
              unit="visits"
            />
            <TopList
              title="Top pages"
              rows={data!.topPages.map((x) => ({ label: x.key, value: x.views }))}
              unit="views"
            />
            <TopList
              title="Top referrers"
              rows={
                data!.topReferrers.length
                  ? data!.topReferrers.map((x) => ({ label: x.key, value: x.views }))
                  : []
              }
              empty="No external referrers yet — visitors arrived directly or via search."
              unit="views"
            />
          </div>
        </>
      )}
    </div>
  );
}

// Smooth-ish area+line chart of sessions over time.
function TrendChart({ points }: { points: SeriesPoint[] }) {
  const W = 720;
  const H = 180;
  const padX = 8;
  const padY = 16;
  const max = Math.max(1, ...points.map((p) => p.sessions));
  const n = points.length;
  const stepX = n > 1 ? (W - padX * 2) / (n - 1) : 0;
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2);

  const line = points.map((p, i) => `${x(i)},${y(p.sessions)}`).join(" ");
  const area =
    `${padX},${H - padY} ` +
    points.map((p, i) => `${x(i)},${y(p.sessions)}`).join(" ") +
    ` ${x(n - 1)},${H - padY}`;

  // A handful of evenly spaced x-axis labels.
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  if (!n) return <p className="mt-4 text-xs text-muted">No data yet.</p>;

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Sessions over time"
      >
        <defs>
          <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#traffic-fill)" className="text-foreground" />
        <polyline
          points={line}
          fill="none"
          className="text-foreground"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={x(i)}
            cy={y(p.sessions)}
            r={n <= 31 ? 2.5 : 0}
            className="text-foreground"
            fill="currentColor"
          >
            <title>{`${p.label}: ${fmt(p.sessions)} visits · ${fmt(p.pageviews)} views`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        {points
          .filter((_, i) => i % labelEvery === 0 || i === n - 1)
          .map((p) => (
            <span key={p.date}>{p.label}</span>
          ))}
      </div>
    </div>
  );
}

// Opacity steps for successive donut segments. We apply these as an inline
// `opacity` (not a Tailwind `/xx` modifier) because `--foreground` is a hex
// literal, so `bg-foreground/55` compiles to an invalid color and renders
// transparent.
const DONUT_OPACITY = [1, 0.55, 0.3, 0.15];

function Donut({
  title,
  icon,
  center,
  centerLabel,
  segments,
}: {
  title: string;
  icon: React.ReactNode;
  center: string;
  centerLabel: string;
  segments: { label: string; value: number }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const dash = frac * C;
    const el = {
      key: seg.label,
      dash,
      gap: C - dash,
      off: -offset,
      opacity: DONUT_OPACITY[i % DONUT_OPACITY.length],
    };
    offset += dash;
    return el;
  });

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {icon} {title}
      </h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-28 w-28 flex-none">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" className="text-subtle" stroke="currentColor" strokeWidth="12" />
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                className="text-foreground"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={a.off}
                style={{ opacity: a.opacity }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold leading-none">{center}</span>
            <span className="text-[10px] text-muted">{centerLabel}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {segments.map((seg, i) => (
            <div key={seg.label} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 flex-none rounded-sm bg-foreground"
                style={{ opacity: DONUT_OPACITY[i % DONUT_OPACITY.length] }}
              />
              <span className="truncate">{seg.label}</span>
              <span className="ml-auto flex-none text-muted">
                {fmt(seg.value)} · {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekdayChart({ rows }: { rows: DayRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.avg));
  return (
    <div className="mt-5">
      <div className="flex h-28 items-end gap-1.5">
        {rows.map((r) => (
          <div
            key={r.day}
            className="flex-1 rounded-t bg-foreground transition-all"
            style={{
              height: r.avg ? `${Math.max((r.avg / max) * 100, 6)}%` : 2,
              minHeight: r.avg ? 4 : 2,
            }}
            title={`${r.day}: ${r.avg} avg visits/day · ${fmt(r.total)} total`}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {rows.map((r) => (
          <span
            key={r.day}
            className="flex-1 text-center text-[10px] text-muted"
          >
            {r.day[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Breakdown({
  title,
  icon,
  rows,
  unit,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { label: string; value: number }[];
  unit: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {icon} {title}
      </h3>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span>{r.label}</span>
              <span className="text-muted">
                {fmt(r.value)} {unit} · {Math.round((r.value / total) * 100)}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${(r.value / total) * 100}%`, opacity: 0.8 }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-muted">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function TopList({
  title,
  rows,
  unit,
  empty,
}: {
  title: string;
  rows: { label: string; value: number }[];
  unit: string;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate" title={r.label}>
                {r.label}
              </span>
              <span className="flex-none text-muted">
                {fmt(r.value)} {unit}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${(r.value / max) * 100}%`, opacity: 0.6 }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-muted">{empty || "No data yet."}</p>
        )}
      </div>
    </div>
  );
}
