import { google } from "googleapis";
import { prisma } from "./prisma";

/**
 * Which calendar new events are written to (`writeId`) and which calendars are
 * checked for busy / out-of-office conflicts (`busyIds`). Configurable by the
 * admin in Settings; falls back to the GOOGLE_CALENDAR_ID env var, then
 * "primary".
 */
export async function getCalendarConfig(): Promise<{
  writeId: string;
  busyIds: string[];
}> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["gcal_write_id", "gcal_busy_ids"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const writeId =
    map["gcal_write_id"]?.trim() ||
    process.env.GOOGLE_CALENDAR_ID ||
    "primary";
  const busyIds = (map["gcal_busy_ids"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { writeId, busyIds: busyIds.length ? busyIds : [writeId] };
}

export interface CalendarSummary {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
}

/** Lists the calendars the connected Google account can access. */
export async function listCalendars(): Promise<CalendarSummary[]> {
  const calendar = await getCalendar();
  const res = await calendar.calendarList.list({ maxResults: 250 });
  return (res.data.items || []).map((c) => ({
    id: c.id || "",
    summary: c.summaryOverride || c.summary || c.id || "",
    primary: Boolean(c.primary),
    accessRole: c.accessRole || "",
  }));
}

// Scopes requested when the admin connects a Google Calendar. Sign-in (comments)
// uses NextAuth separately and does NOT request these, so ordinary visitors are
// never prompted for calendar access.
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/** The redirect URI Google must be configured with for the connect flow. */
export function calendarRedirectUri(): string {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/api/admin/google/callback`;
}

/** Refresh token: the admin-connected one (DB) wins, else the env fallback. */
export async function getRefreshToken(): Promise<string> {
  const row = await prisma.setting.findUnique({
    where: { key: "gcal_refresh_token" },
  });
  return (row?.value || process.env.GOOGLE_REFRESH_TOKEN || "").trim();
}

export async function googleConfigured(): Promise<boolean> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return false;
  }
  return Boolean(await getRefreshToken());
}

function newOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    calendarRedirectUri()
  );
}

/** Build the Google consent URL for connecting a calendar (offline + consent). */
export function calendarConsentUrl(): string {
  return newOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
  });
}

/** Exchange the OAuth code for a refresh token and persist it. */
export async function connectCalendarFromCode(code: string): Promise<boolean> {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) return false;
  await prisma.setting.upsert({
    where: { key: "gcal_refresh_token" },
    update: { value: tokens.refresh_token },
    create: { key: "gcal_refresh_token", value: tokens.refresh_token },
  });
  return true;
}

/** Remove the stored connection. */
export async function disconnectCalendar() {
  await prisma.setting.deleteMany({ where: { key: "gcal_refresh_token" } });
}

async function getOAuthClient() {
  const oauth2 = newOAuthClient();
  oauth2.setCredentials({ refresh_token: await getRefreshToken() });
  return oauth2;
}

export async function getCalendar() {
  return google.calendar({ version: "v3", auth: await getOAuthClient() });
}

export interface CalendarEventSummary {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  location: string;
  status: string;
  calendar: string;
}

/**
 * Lists events across the configured busy calendars within a window — used by
 * the console dashboard calendar view.
 */
export async function listEvents(
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEventSummary[]> {
  const calendar = await getCalendar();
  const { busyIds } = await getCalendarConfig();
  const out: CalendarEventSummary[] = [];

  for (const calId of busyIds) {
    try {
      const res = await calendar.events.list({
        calendarId: calId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });
      for (const e of res.data.items || []) {
        const start = e.start?.dateTime || e.start?.date || "";
        const end = e.end?.dateTime || e.end?.date || "";
        if (!start) continue;
        out.push({
          id: e.id || "",
          title: e.summary || "(no title)",
          start,
          end,
          allDay: Boolean(e.start?.date),
          location: e.location || "",
          status: e.status || "",
          calendar: calId,
        });
      }
    } catch {
      // Skip calendars we can't read.
    }
  }

  out.sort((a, b) => a.start.localeCompare(b.start));
  return out;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
  createMeet?: boolean;
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const calendar = await getCalendar();
  const { writeId } = await getCalendarConfig();
  const calendarId = writeId;

  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: input.createMeet ? 1 : 0,
    sendUpdates: "all",
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start.toISOString() },
      end: { dateTime: input.end.toISOString() },
      attendees: input.attendees?.map((email) => ({ email })),
      conferenceData: input.createMeet
        ? {
            createRequest: {
              requestId: `byaudarya-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    },
  });

  const meetLink =
    res.data.hangoutLink ||
    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ||
    null;

  return { eventId: res.data.id, meetLink };
}

/**
 * Returns true if the calendar has a busy block (including out-of-office /
 * declined-availability events) overlapping the given window.
 */
export async function isBusy(start: Date, end: Date): Promise<boolean> {
  const calendar = await getCalendar();
  const { busyIds } = await getCalendarConfig();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: busyIds.map((id) => ({ id })),
    },
  });
  const calendars = res.data.calendars || {};
  return busyIds.some((id) => (calendars[id]?.busy || []).length > 0);
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getCalendar();
  const { writeId } = await getCalendarConfig();
  await calendar.events.delete({
    calendarId: writeId,
    eventId,
    sendUpdates: "all",
  });
}
