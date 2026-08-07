import { prisma } from "./prisma";
import { hasOpenAI } from "./openai";
import { generateRecap } from "./ai";
import { renderRecapEmail } from "./newsletter";
import { emailConfigured, sendEmail } from "./email";
import { absoluteUrl } from "./utils";
import { getSettings } from "./queries";
import { logActivity } from "./activity";

// Setting keys backing the "auto-schedule the Weekly Recap" feature. All times
// are interpreted in the owner-chosen local timezone (defaults to IST).
export const RECAP_SCHEDULE_KEYS = {
  enabled: "recap_schedule_enabled", // "1" | "0"
  dow: "recap_schedule_dow", // 0 (Sun) … 6 (Sat)
  time: "recap_schedule_time", // "HH:MM" local
  tz: "recap_schedule_tz", // IANA timezone, e.g. "Asia/Kolkata"
  last: "recap_schedule_last", // "YYYY-MM-DD" (local) it last fired — dedupe
} as const;

export const DEFAULT_RECAP_SCHEDULE = {
  enabled: false,
  dow: 5, // Friday
  time: "08:00",
  tz: "Asia/Kolkata",
};

export interface RecapSchedule {
  enabled: boolean;
  dow: number;
  time: string;
  tz: string;
}

/** Read the recap schedule from settings, applying defaults. */
export async function getRecapSchedule(): Promise<RecapSchedule> {
  const s = await getSettings(Object.values(RECAP_SCHEDULE_KEYS));
  const dow = parseInt(s[RECAP_SCHEDULE_KEYS.dow] ?? "", 10);
  const time = s[RECAP_SCHEDULE_KEYS.time] || DEFAULT_RECAP_SCHEDULE.time;
  return {
    enabled: s[RECAP_SCHEDULE_KEYS.enabled] === "1",
    dow: Number.isInteger(dow) && dow >= 0 && dow <= 6 ? dow : DEFAULT_RECAP_SCHEDULE.dow,
    time: /^\d{1,2}:\d{2}$/.test(time) ? time : DEFAULT_RECAP_SCHEDULE.time,
    tz: s[RECAP_SCHEDULE_KEYS.tz] || DEFAULT_RECAP_SCHEDULE.tz,
  };
}

async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Current weekday / hour / minute / date in a given IANA timezone, computed
// without pulling in a date library (Intl handles DST + offsets correctly).
function nowInTz(tz: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const WD: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some ICU builds emit "24" at midnight
  return {
    dow: WD[get("weekday")] ?? -1,
    hour,
    minute: parseInt(get("minute"), 10),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/**
 * Generate a Weekly Recap draft. Returns the created Newsletter row. When
 * `notify` is set, emails the owner a review/approve link. `status` defaults to
 * "draft" (manual) — the scheduler passes "pending_approval".
 */
export async function createRecapDraft(opts?: {
  status?: string;
  notify?: boolean;
}): Promise<{ newsletter: { id: string }; grounded: boolean }> {
  const { data, grounded } = await generateRecap();
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const subject = `The Weekly Recap — ${dateLabel}`;
  const previewHtml = renderRecapEmail({ subject, data, unsubUrl: "#" });

  const nl = await prisma.newsletter.create({
    data: {
      type: "recap",
      subject,
      previewText: data.intro.slice(0, 140),
      contentHtml: previewHtml,
      dataJson: JSON.stringify(data),
      status: opts?.status || "draft",
      audience: "subscribers",
    },
  });

  if (opts?.notify && (await emailConfigured()) && process.env.ADMIN_EMAIL) {
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `[Approve] ${subject} is ready for review`,
        html: `<p>This week's Weekly Recap draft is ready.</p>
        <p>Review, edit and approve it before it goes out:</p>
        <p><a href="${absoluteUrl(`/admin/newsletters/${nl.id}`)}">Open in studio →</a></p>`,
      });
    } catch {
      /* ignore notify errors */
    }
  }

  return { newsletter: nl, grounded };
}

/**
 * Called every minute by the in-process ticker. Creates the recap draft once,
 * on the scheduled weekday at/after the scheduled local time, guarded by a
 * per-day marker so it fires exactly once per week even if a tick is missed.
 */
export async function runDueRecap(): Promise<{ ran: boolean; reason?: string }> {
  const sched = await getRecapSchedule();
  if (!sched.enabled) return { ran: false, reason: "disabled" };
  if (!hasOpenAI()) return { ran: false, reason: "no_openai" };

  const now = nowInTz(sched.tz);
  if (now.dow !== sched.dow) return { ran: false, reason: "wrong_day" };

  const [h, m] = sched.time.split(":").map((n) => parseInt(n, 10));
  const schedMins = h * 60 + m;
  const nowMins = now.hour * 60 + now.minute;
  if (nowMins < schedMins) return { ran: false, reason: "before_time" };

  const last = (await getSettings([RECAP_SCHEDULE_KEYS.last]))[
    RECAP_SCHEDULE_KEYS.last
  ];
  if (last === now.dateKey) return { ran: false, reason: "already_ran" };

  // Claim today's slot BEFORE generating so an overlapping tick can't double-fire.
  await setSetting(RECAP_SCHEDULE_KEYS.last, now.dateKey);
  await createRecapDraft({ status: "pending_approval", notify: true });
  await logActivity(
    "newsletter.recap_scheduled",
    `Weekly Recap auto-drafted (${sched.time} ${sched.tz})`,
    "system"
  );
  return { ran: true };
}
