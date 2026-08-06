import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { createCalendarEvent, googleConfigured } from "@/lib/google";
import { createZoomMeeting, zoomConfigured } from "@/lib/zoom";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, escapeHtml, formatDateTime } from "@/lib/utils";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const appointments = await prisma.appointment.findMany({
    orderBy: { requestedStart: "asc" },
  });
  return NextResponse.json({ appointments });
}

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  mode: z.enum(["meet", "zoom", "physical"]).default("meet"),
  date: z.string().min(1),
  time: z.string().min(1),
  duration: z.number().int().min(15).max(240).default(30),
  purpose: z.string().trim().max(2000).optional().default(""),
  location: z.string().trim().max(240).optional().default(""),
});

// Admin-initiated invite: creates an already-accepted appointment, generates
// the meeting link / calendar event, and emails the invitee.
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  let data: z.infer<typeof inviteSchema>;
  try {
    data = inviteSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 }
    );
  }

  // Interpret the chosen date/time as IST (Asia/Kolkata).
  const start = new Date(`${data.date}T${data.time}:00+05:30`);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
  }
  const end = new Date(start.getTime() + data.duration * 60000);

  let meetingLink: string | null = null;
  const location: string | null =
    data.mode === "physical" ? data.location : null;
  let calendarEventId: string | null = null;
  const warnings: string[] = [];

  try {
    if (data.mode === "zoom") {
      if (zoomConfigured()) {
        meetingLink = await createZoomMeeting({
          topic: `Meeting with ${data.name}`,
          start,
          durationMinutes: data.duration,
        });
      } else {
        warnings.push("Zoom not configured — no link generated.");
      }
    }

    if (await googleConfigured()) {
      const result = await createCalendarEvent({
        summary: `${data.mode === "physical" ? "Meeting" : "Call"} with ${data.name}`,
        description: data.purpose,
        start,
        end,
        attendees: [data.email],
        location: location || undefined,
        createMeet: data.mode === "meet",
      });
      calendarEventId = result.eventId || null;
      if (data.mode === "meet") meetingLink = result.meetLink;
    } else {
      warnings.push("Google Calendar not connected — event not created.");
    }
  } catch (e) {
    warnings.push((e as Error).message);
  }

  const appt = await prisma.appointment.create({
    data: {
      name: data.name,
      email: data.email,
      purpose: data.purpose,
      mode: data.mode,
      requestedStart: start,
      requestedEnd: end,
      status: "accepted",
      meetingLink,
      location,
      calendarEventId,
    },
  });

  if (await emailConfigured()) {
    const details =
      data.mode === "physical"
        ? `<p><strong>Where:</strong> ${escapeHtml(location || "TBC")}</p>`
        : meetingLink
          ? `<p><strong>Join:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
          : "";
    const cancelUrl = absoluteUrl(
      `/appointments/cancel?token=${appt.cancelToken}`
    );
    try {
      await sendEmail({
        to: data.email,
        subject: "You're invited: appointment with Audarya",
        html: `<p>Hi ${escapeHtml(data.name)},</p><p>I&apos;d like to meet on <strong>${formatDateTime(start)} IST</strong>.</p>${details}<p>The invite is on its way to your calendar. Looking forward to it.</p><p>— Audarya</p><p style="font-size:12px;color:#888">Can&apos;t make it? <a href="${cancelUrl}">Cancel this appointment</a>.</p>`,
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ appointment: appt, warnings });
}
