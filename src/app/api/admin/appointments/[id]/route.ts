import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  googleConfigured,
  isBusy,
} from "@/lib/google";
import { emailConfigured, sendEmail } from "@/lib/email";
import {
  getBrandAssets,
  renderBrandedEmail,
  emailButton,
  emailButtonRow,
} from "@/lib/emailTemplate";
import {
  absoluteUrl,
  escapeHtml,
  formatDateTime,
  formatDateTimeInTz,
} from "@/lib/utils";
import { logActivity } from "@/lib/activity";

// Sends a site-themed, branded (banner + signature) appointment email.
async function sendAppointmentEmail(args: {
  to: string;
  subject: string;
  bodyHtml: string;
  preheader?: string;
}) {
  const brand = await getBrandAssets();
  await sendEmail({
    to: args.to,
    subject: args.subject,
    html: renderBrandedEmail({
      bodyHtml: args.bodyHtml,
      bannerUrl: brand.bannerUrl,
      signatureHtml: brand.signatureHtml,
      footer: true,
      preheader: args.preheader,
    }),
  });
}

// The calendar event title: the guest's chosen meeting name when given,
// otherwise a clear "(Group) meeting with <name>".
function calendarSummary(appt: {
  title: string;
  isGroup: boolean;
  name: string;
}): string {
  if (appt.title.trim()) return appt.title.trim();
  return `${appt.isGroup ? "Group meeting" : "Meeting"} with ${appt.name}`;
}

// Primary guest plus any extra group-meeting attendees.
function attendeesFor(appt: { email: string; guests: string }): string[] {
  const extra = appt.guests
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  return Array.from(new Set([appt.email, ...extra]));
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;

  const body = await req.json();
  const action = body.action as
    | "accept"
    | "reject"
    | "notes"
    | "cancel"
    | "edit";

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "edit") {
    const data: {
      name?: string;
      email?: string;
      phone?: string;
      purpose?: string;
      title?: string;
      isGroup?: boolean;
      mode?: string;
      location?: string | null;
      requestedStart?: Date;
      requestedEnd?: Date;
    } = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.email === "string") data.email = body.email;
    if (typeof body.phone === "string") data.phone = body.phone;
    if (typeof body.purpose === "string") data.purpose = body.purpose;
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.isGroup === "boolean") data.isGroup = body.isGroup;
    if (typeof body.mode === "string") data.mode = body.mode;
    if (typeof body.location === "string") data.location = body.location;
    if (body.requestedStart) {
      const d = new Date(body.requestedStart);
      if (!isNaN(d.getTime())) data.requestedStart = d;
    }
    if (body.requestedEnd) {
      const d = new Date(body.requestedEnd);
      if (!isNaN(d.getTime())) data.requestedEnd = d;
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data,
    });

    // If it was already accepted, keep the calendar event in sync and let the
    // guest know the details changed.
    if (updated.status === "accepted") {
      if (appt.calendarEventId && (await googleConfigured())) {
        try {
          await deleteCalendarEvent(appt.calendarEventId);
        } catch {
          /* event may already be gone */
        }
        try {
          const result = await createCalendarEvent({
            summary: calendarSummary(updated),
            description: updated.purpose,
            start: updated.requestedStart,
            end: updated.requestedEnd,
            attendees: attendeesFor(updated),
            location: updated.location || undefined,
            createMeet: updated.mode !== "physical",
          });
          await prisma.appointment.update({
            where: { id: params.id },
            data: {
              calendarEventId: result.eventId || null,
              meetingLink:
                updated.mode !== "physical"
                  ? result.meetLink
                  : updated.meetingLink,
            },
          });
        } catch {
          /* ignore calendar errors */
        }
      }
      if (await emailConfigured()) {
        try {
          const cancelUrl = absoluteUrl(
            `/appointments/cancel?token=${updated.cancelToken}`
          );
          await sendAppointmentEmail({
            to: attendeesFor(updated).join(", "),
            subject: "Your meeting with Audarya has been updated",
            preheader: `Updated to ${formatDateTimeInTz(updated.requestedStart, updated.timezone)}`,
            bodyHtml: `<p>Hi ${escapeHtml(updated.name)},</p>
<p>A quick heads-up — your meeting has been updated to <strong>${formatDateTimeInTz(updated.requestedStart, updated.timezone)}</strong>.</p>
${emailButtonRow([emailButton(cancelUrl, "Cancel or reschedule", "outline")])}`,
          });
        } catch {
          /* ignore */
        }
      }
    }

    await logActivity(
      "appointment.edited",
      `${updated.name} — ${formatDateTime(updated.requestedStart)} IST`
    );
    return NextResponse.json({ appointment: updated });
  }

  if (action === "notes") {
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { adminNotes: body.adminNotes || "" },
    });
    return NextResponse.json({ appointment: updated });
  }

  if (action === "reject") {
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "rejected" },
    });
    if (await emailConfigured()) {
      try {
        const bookUrl = absoluteUrl("/appointments");
        await sendAppointmentEmail({
          to: appt.email,
          subject: "About your meeting request",
          preheader: "Let's find another time that works.",
          bodyHtml: `<p>Hi ${escapeHtml(appt.name)},</p>
<p>Thank you for reaching out. Unfortunately I&apos;m not able to meet at the requested time${
            body.message ? `: ${escapeHtml(body.message)}` : "."
          }</p>
<p>I&apos;d still love to connect — please pick another slot that suits you.</p>
${emailButtonRow([emailButton(bookUrl, "Book another time")])}`,
        });
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ appointment: updated });
  }

  if (action === "cancel") {
    if (appt.calendarEventId && (await googleConfigured())) {
      try {
        await deleteCalendarEvent(appt.calendarEventId);
      } catch {
        /* ignore — event may already be gone */
      }
    }
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "cancelled", calendarEventId: null },
    });
    await logActivity(
      "appointment.cancelled",
      `${appt.name} — ${formatDateTime(appt.requestedStart)} IST`
    );
    if (await emailConfigured()) {
      try {
        const bookUrl = absoluteUrl("/appointments");
        await sendAppointmentEmail({
          to: attendeesFor(appt).join(", "),
          subject: "Your meeting with Audarya has been cancelled",
          preheader: "You can book another time whenever you like.",
          bodyHtml: `<p>Hi ${escapeHtml(appt.name)},</p>
<p>I&apos;m sorry, but I&apos;ve had to cancel our meeting scheduled for <strong>${formatDateTimeInTz(appt.requestedStart, appt.timezone)}</strong>${
            body.message ? `: ${escapeHtml(body.message)}` : "."
          }</p>
<p>Please feel free to book another time — I&apos;d be glad to reschedule.</p>
${emailButtonRow([emailButton(bookUrl, "Book another time")])}`,
        });
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ appointment: updated });
  }

  // accept
  let meetingLink: string | null = null;
  let location: string | null = null;
  let calendarEventId: string | null = null;
  const warnings: string[] = [];

  const isOnline = appt.mode !== "physical";

  try {
    if (appt.mode === "physical") {
      location = body.location || "New Delhi (to be confirmed)";
    }

    if (await googleConfigured()) {
      // Respect calendar out-of-office / busy blocks unless overridden.
      if (!body.force && (await isBusy(appt.requestedStart, appt.requestedEnd))) {
        return NextResponse.json({
          appointment: appt,
          warnings: [],
          conflict:
            "Your Google Calendar is busy (or out-of-office) during this slot. Accept again to override.",
        });
      }
      // Online meetings get a Google Meet link generated automatically.
      const result = await createCalendarEvent({
        summary: calendarSummary(appt),
        description: appt.purpose,
        start: appt.requestedStart,
        end: appt.requestedEnd,
        attendees: attendeesFor(appt),
        location: location || undefined,
        createMeet: isOnline,
      });
      calendarEventId = result.eventId || null;
      if (isOnline) meetingLink = result.meetLink;
    } else {
      warnings.push("Google Calendar not connected — event not created.");
    }
  } catch (e) {
    warnings.push((e as Error).message);
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: "accepted",
      meetingLink,
      location,
      calendarEventId,
    },
  });

  await logActivity(
    "appointment.accepted",
    `${appt.name} — ${formatDateTime(appt.requestedStart)} IST (${appt.mode})`
  );

  if (await emailConfigured()) {
    const meetingName = calendarSummary(appt);
    const rows: string[] = [
      `<tr><td style="padding:4px 0;color:#6b6b66;width:96px;">When</td><td style="padding:4px 0;color:#1a1a18;"><strong>${formatDateTimeInTz(appt.requestedStart, appt.timezone)}</strong></td></tr>`,
      `<tr><td style="padding:4px 0;color:#6b6b66;">Format</td><td style="padding:4px 0;color:#1a1a18;">${appt.mode === "physical" ? "In person" : "Google Meet (video)"}</td></tr>`,
    ];
    if (appt.mode === "physical") {
      rows.push(
        `<tr><td style="padding:4px 0;color:#6b6b66;">Where</td><td style="padding:4px 0;color:#1a1a18;">${escapeHtml(location)}</td></tr>`
      );
    } else if (meetingLink) {
      rows.push(
        `<tr><td style="padding:4px 0;color:#6b6b66;">Join</td><td style="padding:4px 0;"><a href="${meetingLink}" style="color:#1a1a18;">${meetingLink}</a></td></tr>`
      );
    }
    const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;padding:16px 18px;background:#f4f2ec;border-radius:12px;font-size:14px;line-height:1.5;">
<tr><td colspan="2" style="padding-bottom:8px;font-family:Georgia,serif;font-size:16px;color:#1a1a18;"><strong>${escapeHtml(meetingName)}</strong></td></tr>
${rows.join("\n")}
</table>`;
    const cancelUrl = absoluteUrl(
      `/appointments/cancel?token=${appt.cancelToken}`
    );
    const buttons = [
      emailButton(cancelUrl, "Reschedule", "outline"),
      emailButton(cancelUrl, "Cancel", "outline"),
    ];
    if (meetingLink) {
      buttons.unshift(emailButton(meetingLink, "Join the meeting"));
    }
    try {
      await sendAppointmentEmail({
        to: attendeesFor(appt).join(", "),
        subject: "Your meeting with Audarya is confirmed",
        preheader: `Confirmed for ${formatDateTimeInTz(appt.requestedStart, appt.timezone)}`,
        bodyHtml: `<p>Hi ${escapeHtml(appt.name)},</p>
<p>Great news — your ${appt.isGroup ? "group meeting" : "meeting"} with Audarya is confirmed.</p>
${details}
<p>Looking forward to it. If plans change, you can reschedule or cancel any time using the buttons below.</p>
${emailButtonRow(buttons)}`,
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ appointment: updated, warnings });
}
