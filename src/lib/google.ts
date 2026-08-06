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

// Scopes requested when the admin connects Google. Sign-in (comments) uses
// NextAuth separately and does NOT request these, so ordinary visitors are
// never prompted.
//
// IMPORTANT: Calendar is requested on its own by default. Drive + Docs are
// Google "restricted" scopes — requesting them for an unverified app makes
// Google block the whole consent flow ("Access blocked / app not verified"),
// which is what broke calendar authorization. Drive/Docs (monthly log export,
// letterhead) are opt-in via the "extended" connect only.
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export const EXTENDED_SCOPES = [
  ...CALENDAR_SCOPES,
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
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

/**
 * Build the Google consent URL for connecting a calendar (offline + consent).
 * By default only Calendar scopes are requested; pass `extended` to also ask
 * for Drive/Docs (needed for log export / letterhead).
 */
export function calendarConsentUrl(extended = false): string {
  return newOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: extended ? EXTENDED_SCOPES : CALENDAR_SCOPES,
  });
}

/**
 * Exchange the OAuth code for a refresh token and persist it. Google only
 * returns a refresh token on the first consent unless prompt=consent is used
 * (we do). If none comes back but we already have one stored, keep it.
 */
export async function connectCalendarFromCode(code: string): Promise<boolean> {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    // No new refresh token — succeed only if we already have one stored.
    return Boolean(await getRefreshToken());
  }
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

// ---- Gmail sending (two mailboxes) -----------------------------------------
//
// The site can connect two Google mailboxes for OUTGOING email:
//   "mass"     — no-reply / bulk mail (newsletters, digests): mail@byaudarya.com
//   "personal" — mail Audarya sends deliberately (greetings, the composer):
//                audarya@byaudarya.com
// Each is authorized independently via OAuth and sent through the Gmail API, so
// no SMTP app passwords are needed. Reuses the same OAuth client + callback as
// calendar; the connect flow tags the request with a `state` so the callback
// knows which mailbox it is.

export type MailRole = "mass" | "personal";

// gmail.send is a Google "restricted" scope, but sending from your own account
// while signed in as a test user works. openid + email lets us read back which
// address was connected so we can label it and set the From header correctly.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];

function gmailKeys(role: MailRole) {
  return { token: `gmail_${role}_token`, email: `gmail_${role}_email` };
}

/** Consent URL to connect one mailbox for sending. */
export function gmailConsentUrl(role: MailRole): string {
  return newOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: GMAIL_SCOPES,
    state: `gmail:${role}`,
  });
}

export async function getGmailAccount(
  role: MailRole
): Promise<{ refreshToken: string; email: string } | null> {
  const keys = gmailKeys(role);
  const rows = await prisma.setting.findMany({
    where: { key: { in: [keys.token, keys.email] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  const refreshToken = (map[keys.token] || "").trim();
  if (!refreshToken) return null;
  return { refreshToken, email: (map[keys.email] || "").trim() };
}

function emailFromIdToken(idToken: string | null | undefined): string {
  if (!idToken) return "";
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
    ) as { email?: string };
    return (payload.email || "").toLowerCase();
  } catch {
    return "";
  }
}

/** Exchange the OAuth code and store the refresh token for `role`. */
export async function connectGmailFromCode(
  code: string,
  role: MailRole
): Promise<{ ok: boolean; email: string }> {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  const email = emailFromIdToken(tokens.id_token);
  const keys = gmailKeys(role);

  if (!tokens.refresh_token) {
    const existing = await getGmailAccount(role);
    return { ok: Boolean(existing), email: existing?.email || email };
  }
  await prisma.setting.upsert({
    where: { key: keys.token },
    update: { value: tokens.refresh_token },
    create: { key: keys.token, value: tokens.refresh_token },
  });
  if (email) {
    await prisma.setting.upsert({
      where: { key: keys.email },
      update: { value: email },
      create: { key: keys.email, value: email },
    });
  }
  return { ok: true, email };
}

export async function disconnectGmail(role: MailRole) {
  const keys = gmailKeys(role);
  await prisma.setting.deleteMany({ where: { key: { in: [keys.token, keys.email] } } });
}

function encodeHeaderWord(value: string): string {
  // RFC 2047 encode a header value when it contains non-ASCII characters.
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Keep the display name from `from` but force the address to `address`. */
function withAddress(from: string, address: string): string {
  const name = from.replace(/<[^>]*>/, "").replace(/["]/g, "").trim() || "Audarya Gupta";
  return `${encodeHeaderWord(name)} <${address}>`;
}

interface GmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

function buildRawMessage(from: string, m: GmailMessage): string {
  const boundary = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const text = m.text || m.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const headers = [
    `From: ${from}`,
    `To: ${m.to}`,
    m.replyTo ? `Reply-To: ${m.replyTo}` : "",
    `Subject: ${encodeHeaderWord(m.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join("\r\n");
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(m.html, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return `${headers}\r\n\r\n${body}`;
}

/** Send one message through the Gmail API using the mailbox for `role`. */
export async function sendGmailMessage(role: MailRole, m: GmailMessage) {
  const account = await getGmailAccount(role);
  if (!account) throw new Error(`Gmail mailbox (${role}) is not connected`);
  const oauth2 = newOAuthClient();
  oauth2.setCredentials({ refresh_token: account.refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const from = withAddress(m.from || "Audarya Gupta", account.email);
  const raw = Buffer.from(buildRawMessage(from, m), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return gmail.users.messages.send({ userId: "me", requestBody: { raw } });
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

// ---- Drive / Docs ----------------------------------------------------------

export async function getDrive() {
  return google.drive({ version: "v3", auth: await getOAuthClient() });
}

export async function getDocs() {
  return google.docs({ version: "v1", auth: await getOAuthClient() });
}

/** Find (or create) a Drive folder by name under the account root. */
export async function ensureDriveFolder(name: string): Promise<string> {
  const drive = await getDrive();
  const q =
    `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${name.replace(
      /'/g,
      "\\'"
    )}'`;
  const found = await drive.files.list({ q, fields: "files(id,name)" });
  const existing = found.data.files?.[0]?.id;
  if (existing) return existing;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });
  return created.data.id || "";
}

/** Upload (or overwrite) a text file in a Drive folder. Returns the file id. */
export async function uploadTextFile(
  folderId: string,
  name: string,
  content: string,
  mimeType = "text/csv"
): Promise<string> {
  const drive = await getDrive();
  const existing = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
  });
  const media = { mimeType, body: content };
  const fileId = existing.data.files?.[0]?.id;
  if (fileId) {
    await drive.files.update({ fileId, media });
    return fileId;
  }
  const created = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media,
    fields: "id",
  });
  return created.data.id || "";
}
