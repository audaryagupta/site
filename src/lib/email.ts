import nodemailer from "nodemailer";
import { getGmailAccount, sendGmailMessage, type MailRole } from "./google";

export function getTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASS are not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// Default "from" for transactional / no-reply site email (newsletters,
// appointments, contact replies, digests). Points at the primary mailbox.
export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "Audarya Gupta <mail@byaudarya.com>";

// "from" for personal greeting / birthday / composed email. Comes from
// Audarya's personal address.
export const GREETINGS_FROM =
  process.env.GREETINGS_FROM || "Audarya Gupta <audarya@byaudarya.com>";

function defaultFrom(account: MailRole): string {
  return account === "personal" ? GREETINGS_FROM : EMAIL_FROM;
}

/**
 * Email is ready if either a Gmail mailbox is connected (preferred, via OAuth)
 * or SMTP credentials are set. Async because the Gmail connection lives in the
 * database.
 */
export async function emailConfigured(): Promise<boolean> {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return true;
  const [mass, personal] = await Promise.all([
    getGmailAccount("mass"),
    getGmailAccount("personal"),
  ]);
  return Boolean(mass || personal);
}

interface DeliverArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send one message through the chosen mailbox. Prefers the Gmail API for that
 * role; falls back to the connected mailbox of the other role, then SMTP.
 */
async function deliver(account: MailRole, m: DeliverArgs) {
  const from = m.from || defaultFrom(account);

  // Preferred: the mailbox for this role.
  if (await getGmailAccount(account)) {
    return sendGmailMessage(account, { ...m, from });
  }
  // Fall back to whichever mailbox is connected so mail still goes out.
  const other: MailRole = account === "mass" ? "personal" : "mass";
  if (await getGmailAccount(other)) {
    return sendGmailMessage(other, { ...m, from });
  }
  // Legacy SMTP fallback.
  const transport = getTransport();
  return transport.sendMail({
    from,
    to: m.to,
    subject: m.subject,
    html: m.html,
    text: m.text,
    replyTo: m.replyTo,
  });
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  /** Which mailbox to send from. Defaults to "mass" (no-reply). */
  account?: MailRole;
}

export async function sendEmail({ account = "mass", ...rest }: SendArgs) {
  return deliver(account, rest);
}

/**
 * Sends the same message to many recipients one-by-one (personalised) with a
 * small delay so Gmail/Workspace sending limits are respected.
 */
export async function sendBulk(
  recipients: { email: string; firstName?: string }[],
  build: (r: { email: string; firstName?: string }) => {
    subject: string;
    html: string;
    text?: string;
  },
  account: MailRole = "mass"
) {
  let sent = 0;
  const errors: { email: string; error: string }[] = [];
  for (const r of recipients) {
    try {
      const { subject, html, text } = build(r);
      await deliver(account, { to: r.email, subject, html, text });
      sent += 1;
      await new Promise((res) => setTimeout(res, 120));
    } catch (e) {
      errors.push({ email: r.email, error: (e as Error).message });
    }
  }
  return { sent, errors };
}
