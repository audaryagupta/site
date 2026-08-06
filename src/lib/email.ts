import nodemailer from "nodemailer";

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

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Default "from" for transactional site email (newsletters, appointments,
// contact replies, digests). Points at the primary mailbox.
export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "Audarya Gupta <mail@byaudarya.com>";

// "from" for personal greeting / birthday / celebration email. Kept separate so
// these come from Audarya's personal address. To actually send as this address
// through the SMTP account, it must be a verified "Send mail as" alias on that
// Gmail/Workspace account (or set GREETINGS_FROM to the SMTP account itself).
export const GREETINGS_FROM =
  process.env.GREETINGS_FROM ||
  "Audarya Gupta <audarya@byaudarya.com>";

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from,
}: SendArgs) {
  const transport = getTransport();
  return transport.sendMail({
    from: from || EMAIL_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
  });
}

/**
 * Sends the same message to many recipients one-by-one (personalised) with a
 * small delay so Gmail/Workspace SMTP limits are respected.
 */
export async function sendBulk(
  recipients: { email: string; firstName?: string }[],
  build: (r: { email: string; firstName?: string }) => {
    subject: string;
    html: string;
    text?: string;
  }
) {
  const transport = getTransport();
  let sent = 0;
  const errors: { email: string; error: string }[] = [];
  for (const r of recipients) {
    try {
      const { subject, html, text } = build(r);
      await transport.sendMail({
        from: EMAIL_FROM,
        to: r.email,
        subject,
        html,
        text,
      });
      sent += 1;
      await new Promise((res) => setTimeout(res, 120));
    } catch (e) {
      errors.push({ email: r.email, error: (e as Error).message });
    }
  }
  return { sent, errors };
}
