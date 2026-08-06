import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent, googleConfigured } from "@/lib/google";
import { emailConfigured, sendEmail } from "@/lib/email";
import { escapeHtml, formatDateTime } from "@/lib/utils";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { token } = schema.parse(await req.json());
    const appt = await prisma.appointment.findUnique({
      where: { cancelToken: token },
    });
    if (!appt) {
      return NextResponse.json({ error: "Invalid link." }, { status: 404 });
    }
    if (appt.status === "cancelled") {
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }

    // Remove the calendar event (best-effort) so the slot frees up.
    if ((await googleConfigured()) && appt.calendarEventId) {
      try {
        await deleteCalendarEvent(appt.calendarEventId);
      } catch {
        /* ignore */
      }
    }

    await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: "cancelled" },
    });

    if (await emailConfigured() && process.env.ADMIN_EMAIL) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `Appointment cancelled — ${appt.name}`,
          html: `<p><strong>${escapeHtml(
            appt.name
          )}</strong> cancelled their appointment scheduled for ${formatDateTime(
            appt.requestedStart
          )} IST.</p>`,
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not cancel." }, { status: 500 });
  }
}
