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
  const calendar = getCalendar();
  const res = await calendar.calendarList.list({ maxResults: 250 });
  return (res.data.items || []).map((c) => ({
    id: c.id || "",
    summary: c.summaryOverride || c.summary || c.id || "",
    primary: Boolean(c.primary),
    accessRole: c.accessRole || "",
  }));
}

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getOAuthClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

export function getCalendar() {
  return google.calendar({ version: "v3", auth: getOAuthClient() });
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
  const calendar = getCalendar();
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
  const calendar = getCalendar();
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
  const calendar = getCalendar();
  const { writeId } = await getCalendarConfig();
  await calendar.events.delete({
    calendarId: writeId,
    eventId,
    sendUpdates: "all",
  });
}
