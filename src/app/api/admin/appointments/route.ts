import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { createCalendarEvent, googleConfigured } from "@/lib/google";
import { emailConfigured, sendEmail } from "@/lib/email";
import {
  getBrandAssets,
  renderBrandedEmail,
  emailButton,
  emailButtonRow,
} from "@/lib/emailTemplate";
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
  // Additional attendees for group meetings.
  guests: z.array(z.string().email()).max(50).optional().default([]),
  title: z.string().trim().max(140).optional().default(""),
  isGroup: z.boolean().optional().default(false),
  mode: z.enum(["meet", "physical"]).default("meet"),
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

  const isOnline = data.mode !== "physical";
  const meetingName =
    data.title.trim() ||
    `${data.isGroup ? "Group meeting" : "Meeting"} with ${data.name}`;

  // Extra attendees only apply to group meetings; de-dupe against the primary.
  const guests = data.isGroup
    ? Array.from(
        new Set(
          data.guests
            .map((g) => g.trim().toLowerCase())
            .filter((g) => g && g !== data.email.trim().toLowerCase())
        )
      )
    : [];
  const allAttendees = [data.email, ...guests];

  let meetingLink: string | null = null;
  const location: string | null =
    data.mode === "physical" ? data.location : null;
  let calendarEventId: string | null = null;
  const warnings: string[] = [];

  try {
    if (await googleConfigured()) {
      // Online meetings get a Google Meet link generated automatically.
      const result = await createCalendarEvent({
        summary: meetingName,
        description: data.purpose,
        start,
        end,
        attendees: allAttendees,
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

  const appt = await prisma.appointment.create({
    data: {
      name: data.name,
      email: data.email,
      purpose: data.purpose,
      title: data.title,
      isGroup: data.isGroup,
      guests: guests.join(", "),
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
    const rows: string[] = [
      `<tr><td style="padding:4px 0;color:#6b6b66;width:96px;">When</td><td style="padding:4px 0;color:#1a1a18;"><strong>${formatDateTime(start)} IST</strong></td></tr>`,
      `<tr><td style="padding:4px 0;color:#6b6b66;">Format</td><td style="padding:4px 0;color:#1a1a18;">${data.mode === "physical" ? "In person" : "Google Meet (video)"}</td></tr>`,
    ];
    if (guests.length) {
      rows.push(
        `<tr><td style="padding:4px 0;color:#6b6b66;">Guests</td><td style="padding:4px 0;color:#1a1a18;">${escapeHtml(
          [data.email, ...guests].join(", ")
        )}</td></tr>`
      );
    }
    if (data.mode === "physical") {
      rows.push(
        `<tr><td style="padding:4px 0;color:#6b6b66;">Where</td><td style="padding:4px 0;color:#1a1a18;">${escapeHtml(location || "TBC")}</td></tr>`
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
    if (meetingLink) buttons.unshift(emailButton(meetingLink, "Join the meeting"));
    try {
      const brand = await getBrandAssets();
      await sendEmail({
        to: allAttendees.join(", "),
        subject: `You're invited: ${data.isGroup ? "group meeting" : "meeting"} with Audarya`,
        html: renderBrandedEmail({
          bannerUrl: brand.bannerUrl,
          signatureHtml: brand.signatureHtml,
          footer: true,
          preheader: `${formatDateTime(start)} IST`,
          bodyHtml: `<p>Hi ${escapeHtml(data.name)},</p>
<p>I&apos;d like to invite you to a ${data.isGroup ? "group meeting" : "meeting"} with me. The details are below and a calendar invite is on its way.</p>
${details}
<p>Looking forward to it. If the time doesn&apos;t work, you can reschedule or cancel any time.</p>
${emailButtonRow(buttons)}`,
        }),
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ appointment: appt, warnings });
}
