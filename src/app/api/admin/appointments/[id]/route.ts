import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  googleConfigured,
  isBusy,
} from "@/lib/google";
import { createZoomMeeting, zoomConfigured } from "@/lib/zoom";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, escapeHtml, formatDateTime } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

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
      mode?: string;
      location?: string | null;
      requestedStart?: Date;
      requestedEnd?: Date;
    } = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.email === "string") data.email = body.email;
    if (typeof body.phone === "string") data.phone = body.phone;
    if (typeof body.purpose === "string") data.purpose = body.purpose;
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
            summary: `${updated.mode === "physical" ? "Meeting" : "Call"} with ${updated.name}`,
            description: updated.purpose,
            start: updated.requestedStart,
            end: updated.requestedEnd,
            attendees: [updated.email],
            location: updated.location || undefined,
            createMeet: updated.mode === "meet",
          });
          await prisma.appointment.update({
            where: { id: params.id },
            data: {
              calendarEventId: result.eventId || null,
              meetingLink:
                updated.mode === "meet" ? result.meetLink : updated.meetingLink,
            },
          });
        } catch {
          /* ignore calendar errors */
        }
      }
      if (emailConfigured()) {
        try {
          await sendEmail({
            to: updated.email,
            subject: "Your appointment details have been updated",
            html: `<p>Hi ${escapeHtml(updated.name)},</p><p>Your appointment has been updated to <strong>${formatDateTime(updated.requestedStart)} IST</strong>.</p><p>— Audarya</p>`,
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
    if (emailConfigured()) {
      try {
        await sendEmail({
          to: appt.email,
          subject: "About your appointment request",
          html: `<p>Hi ${escapeHtml(appt.name)},</p><p>Thank you for reaching out. Unfortunately I&apos;m unable to meet at the requested time${
            body.message ? `: ${escapeHtml(body.message)}` : "."
          }</p><p>Please feel free to propose another slot.</p><p>— Audarya</p>`,
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
    if (emailConfigured()) {
      try {
        await sendEmail({
          to: appt.email,
          subject: "Your appointment has been cancelled",
          html: `<p>Hi ${escapeHtml(appt.name)},</p><p>I&apos;m sorry, but I&apos;ve had to cancel our appointment scheduled for <strong>${formatDateTime(appt.requestedStart)} IST</strong>${
            body.message ? `: ${escapeHtml(body.message)}` : "."
          }</p><p>Please feel free to book another time.</p><p>— Audarya</p>`,
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

  try {
    if (appt.mode === "zoom") {
      if (zoomConfigured()) {
        const durationMinutes = Math.round(
          (appt.requestedEnd.getTime() - appt.requestedStart.getTime()) / 60000
        );
        meetingLink = await createZoomMeeting({
          topic: `Meeting with ${appt.name}`,
          start: appt.requestedStart,
          durationMinutes,
        });
      } else {
        warnings.push("Zoom not configured — no link generated.");
      }
    }
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
      const result = await createCalendarEvent({
        summary: `${appt.mode === "physical" ? "Meeting" : "Call"} with ${appt.name}`,
        description: appt.purpose,
        start: appt.requestedStart,
        end: appt.requestedEnd,
        attendees: [appt.email],
        location: location || undefined,
        createMeet: appt.mode === "meet",
      });
      calendarEventId = result.eventId || null;
      if (appt.mode === "meet") meetingLink = result.meetLink;
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

  if (emailConfigured()) {
    const details =
      appt.mode === "physical"
        ? `<p><strong>Where:</strong> ${escapeHtml(location)}</p>`
        : meetingLink
          ? `<p><strong>Join:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
          : "";
    const cancelUrl = absoluteUrl(`/appointments/cancel?token=${appt.cancelToken}`);
    try {
      await sendEmail({
        to: appt.email,
        subject: "Your appointment is confirmed",
        html: `<p>Hi ${escapeHtml(appt.name)},</p><p>Your appointment is confirmed for <strong>${formatDateTime(appt.requestedStart)} IST</strong>.</p>${details}<p>Looking forward to it.</p><p>— Audarya</p><p style="font-size:12px;color:#888">Need to cancel? <a href="${cancelUrl}">Cancel this appointment</a>.</p>`,
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ appointment: updated, warnings });
}
