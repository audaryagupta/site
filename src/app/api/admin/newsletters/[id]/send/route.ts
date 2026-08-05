import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { emailConfigured, sendBulk, sendEmail } from "@/lib/email";
import {
  renderRecapEmail,
  renderGenericEmail,
  type RecapData,
} from "@/lib/newsletter";
import { absoluteUrl } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { emailsPaused, filterBlacklisted } from "@/lib/mailPolicy";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "SMTP (Google Workspace) email is not configured yet." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const testMode = Boolean(body.test);

  // A test send to the admin is always allowed; real sends respect the pause.
  if (!testMode && (await emailsPaused())) {
    return NextResponse.json(
      { error: "Emails are paused. Resume sending in Settings first." },
      { status: 409 }
    );
  }

  const nl = await prisma.newsletter.findUnique({ where: { id: params.id } });
  if (!nl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Approval gate — real sends require explicit approval.
  if (!testMode && nl.status !== "approved") {
    return NextResponse.json(
      { error: "Approve this newsletter before sending." },
      { status: 400 }
    );
  }

  const recapData: RecapData | null = nl.dataJson
    ? (JSON.parse(nl.dataJson) as RecapData)
    : null;

  function buildFor(r: {
    email: string;
    firstName?: string;
    addedNote?: boolean;
  }) {
    const unsubUrl = absoluteUrl(`/api/unsubscribe?token=__TOKEN__`);
    if (nl!.type === "recap" && recapData) {
      return {
        subject: nl!.subject,
        html: renderRecapEmail({
          firstName: r.firstName,
          subject: nl!.subject,
          data: recapData,
          unsubUrl,
          addedNote: r.addedNote,
        }),
      };
    }
    return {
      subject: nl!.subject,
      html: renderGenericEmail({
        firstName: r.firstName,
        subject: nl!.subject,
        bodyHtml: nl!.contentHtml,
        previewText: nl!.previewText,
        unsubUrl,
        addedNote: r.addedNote,
      }),
    };
  }

  // Test send: single email to the admin.
  if (testMode) {
    const to = process.env.ADMIN_EMAIL!;
    const built = buildFor({ email: to, firstName: "Audarya" });
    await sendEmail({
      to,
      subject: `[TEST] ${built.subject}`,
      html: built.html.replace(/__TOKEN__/g, "test"),
    });
    return NextResponse.json({ ok: true, test: true });
  }

  // Real send
  await prisma.newsletter.update({
    where: { id: nl.id },
    data: { status: "sending" },
  });

  let recipients: {
    id?: string;
    email: string;
    firstName?: string;
    token: string;
    addedNote?: boolean;
  }[] = [];
  if (nl.audience === "contacts") {
    const contacts = await prisma.contact.findMany();
    recipients = contacts.map((c) => ({
      email: c.email,
      firstName: c.firstName,
      token: "contact",
    }));
  } else {
    const subs = await prisma.subscriber.findMany({
      where: { status: "active" },
    });
    recipients = subs.map((s) => ({
      id: s.id,
      email: s.email,
      firstName: s.firstName,
      token: s.unsubToken,
      // Owner-added folks get the "Audarya added you" note on their first
      // four newsletters (welcomeRemaining counts down after each send).
      addedNote: s.addedByOwner && s.welcomeRemaining > 0,
    }));
  }

  // Never mail blacklisted addresses.
  recipients = await filterBlacklisted(recipients);

  const { sent, errors } = await sendBulk(recipients, (r) => {
    const rr = r as (typeof recipients)[number];
    const built = buildFor({
      email: rr.email,
      firstName: rr.firstName,
      addedNote: rr.addedNote,
    });
    return {
      subject: built.subject,
      html: built.html.replace(/__TOKEN__/g, rr.token || ""),
    };
  });

  // Decrement the welcome-note counter only for subscribers that actually
  // received this newsletter (skip ones whose send errored).
  const failedEmails = new Set(errors.map((e) => e.email));
  const toDecrement = recipients.filter(
    (r) => r.id && r.addedNote && !failedEmails.has(r.email)
  );
  if (toDecrement.length) {
    await prisma.$transaction(
      toDecrement.map((r) =>
        prisma.subscriber.update({
          where: { id: r.id },
          data: { welcomeRemaining: { decrement: 1 } },
        })
      )
    );
  }

  await prisma.newsletter.update({
    where: { id: nl.id },
    data: {
      status: errors.length && sent === 0 ? "failed" : "sent",
      sentAt: new Date(),
      recipientCount: sent,
    },
  });

  await logActivity(
    "newsletter.sent",
    `“${nl.subject}” → ${sent} recipient(s)`
  );

  return NextResponse.json({ ok: true, sent, failed: errors.length });
}
