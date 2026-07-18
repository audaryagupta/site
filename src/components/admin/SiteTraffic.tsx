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
interface Data {
  range: number;
  summary: Summary;
  sources: KeyCount[];
  devices: KeyCount[];
  topPages: KeyViews[];
  topReferrers: KeyViews[];
  monthly: MonthRow[];
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

          {/* Monthly trend */}
          <div className="mt-6 rounded-lg border border-line bg-card p-5">
            <h3 className="text-sm font-semibold">Visitors by month</h3>
            <p className="text-xs text-muted">Last 12 months · page views</p>
            <div className="mt-5 flex h-40 items-end gap-2">
              {data!.monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted">{m.pageviews || ""}</span>
                  <div
                    className="w-full rounded-t bg-foreground/80 transition-all"
                    style={{ height: `${(m.pageviews / maxMonthly) * 100}%`, minHeight: m.pageviews ? 3 : 0 }}
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
                className="h-full rounded-full bg-foreground/80"
                style={{ width: `${(r.value / total) * 100}%` }}
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
                className="h-full rounded-full bg-foreground/60"
                style={{ width: `${(r.value / max) * 100}%` }}
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
