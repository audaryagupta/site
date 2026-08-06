import { prisma } from "./prisma";
import { sendBulk } from "./email";
import type { MailRole } from "./google";
import { logActivity } from "./activity";

/**
 * Sends any scheduled emails whose sendAt has passed. Idempotent and safe to
 * call repeatedly — only rows still in "scheduled" state are picked up, and each
 * is flipped to sent/failed. Used by both the cron endpoint and the in-process
 * ticker (see instrumentation.ts).
 */
export async function runDueScheduledEmails(): Promise<{ processed: number }> {
  const due = await prisma.scheduledEmail.findMany({
    where: { status: "scheduled", sendAt: { lte: new Date() } },
    orderBy: { sendAt: "asc" },
    take: 20,
  });

  let processed = 0;
  for (const row of due) {
    // Claim the row first so a concurrent ticker/cron won't double-send.
    const claimed = await prisma.scheduledEmail.updateMany({
      where: { id: row.id, status: "scheduled" },
      data: { status: "sending" },
    });
    if (claimed.count === 0) continue;

    let recipients: string[] = [];
    try {
      recipients = JSON.parse(row.recipients) as string[];
    } catch {
      recipients = [];
    }

    try {
      const { sent, errors } = await sendBulk(
        recipients.map((email) => ({ email })),
        () => ({ subject: row.subject, html: row.html }),
        (row.account as MailRole) || "personal"
      );
      await prisma.scheduledEmail.update({
        where: { id: row.id },
        data: {
          status: errors.length && sent === 0 ? "failed" : "sent",
          sentCount: sent,
          sentAt: new Date(),
          error: errors.length ? errors[0].error.slice(0, 300) : "",
        },
      });
      await logActivity(
        "email.scheduled_sent",
        `Scheduled "${row.subject}" sent to ${sent}/${recipients.length}`,
        "system"
      );
    } catch (e) {
      await prisma.scheduledEmail.update({
        where: { id: row.id },
        data: { status: "failed", error: (e as Error).message.slice(0, 300) },
      });
    }
    processed += 1;
  }

  return { processed };
}
