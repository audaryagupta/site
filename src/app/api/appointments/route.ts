import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { getBrandAssets, renderBrandedEmail } from "@/lib/emailTemplate";
import { verifyCaptcha } from "@/lib/captcha";
import {
  absoluteUrl,
  escapeHtml,
  formatDateTime,
  formatDateTimeInTz,
} from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[0-9][0-9\s().-]{7,}$/, "Phone number with country code required")
    .max(40),
  purpose: z.string().trim().min(1).max(2000),
  title: z.string().trim().max(140).optional().default(""),
  isGroup: z.boolean().optional().default(false),
  mode: z.enum(["meet", "physical"]).default("meet"),
  date: z.string().min(1),
  time: z.string().min(1),
  // Absolute instant for the chosen slot (resolved client-side from the owner's
  // availability timezone). Preferred over date/time when present.
  startISO: z.string().optional().default(""),
  // The requester's chosen display timezone (IANA).
  timezone: z.string().trim().max(60).optional().default("Asia/Kolkata"),
  duration: z.number().int().min(15).max(240).default(30),
  captchaToken: z.string().optional().default(""),
  captchaAnswer: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;
    const captchaOk = await verifyCaptcha(
      data.captchaToken,
      data.captchaAnswer,
      ip
    );
    if (!captchaOk) {
      return NextResponse.json(
        { error: "CAPTCHA check failed. Please try again." },
        { status: 400 }
      );
    }

    // Prefer the absolute instant resolved client-side (from the owner's
    // availability timezone); fall back to interpreting date/time as IST.
    let start = data.startISO ? new Date(data.startISO) : new Date(NaN);
    if (isNaN(start.getTime())) {
      start = new Date(`${data.date}T${data.time}:00+05:30`);
    }
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time." },
        { status: 400 }
      );
    }
    const end = new Date(start.getTime() + data.duration * 60000);

    const appt = await prisma.appointment.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        purpose: data.purpose,
        title: data.title,
        isGroup: data.isGroup,
        mode: data.mode,
        requestedStart: start,
        requestedEnd: end,
        timezone: data.timezone || "Asia/Kolkata",
      },
    });

    const meetingLabel = data.isGroup
      ? "group meeting with Audarya"
      : "meeting with Audarya";

    if (await emailConfigured()) {
      // Notify the admin
      if (process.env.ADMIN_EMAIL) {
        try {
          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            replyTo: data.email,
            subject: `New meeting request from ${data.name}`,
            html: `<p><strong>${escapeHtml(data.name)}</strong> requested a ${escapeHtml(
              meetingLabel
            )} (${data.mode === "physical" ? "in person" : "Google Meet"}).</p>
            ${data.title ? `<p>Meeting: <strong>${escapeHtml(data.title)}</strong></p>` : ""}
            <p>When: ${formatDateTime(start)} IST (${data.duration} min)<br/>
            Their time: ${formatDateTimeInTz(start, data.timezone)}<br/>
            Contact: ${escapeHtml(data.email)}${
              data.phone ? `, ${escapeHtml(data.phone)}` : ""
            }</p>
            <p>Purpose: ${escapeHtml(data.purpose) || "—"}</p>
            <p><a href="${absoluteUrl(
              "/admin/appointments"
            )}">Review in dashboard →</a></p>`,
          });
        } catch {
          // ignore
        }
      }
      // Acknowledge the requester (branded, in their timezone).
      try {
        const brand = await getBrandAssets();
        await sendEmail({
          to: data.email,
          subject: "Your meeting request was received",
          html: renderBrandedEmail({
            bannerUrl: brand.bannerUrl,
            signatureHtml: brand.signatureHtml,
            footer: true,
            preheader: `Requested for ${formatDateTimeInTz(start, data.timezone)}`,
            bodyHtml: `<p>Hi ${escapeHtml(data.name)},</p>
<p>Thanks — your request for a <strong>${escapeHtml(meetingLabel)}</strong>${
              data.title ? ` (“${escapeHtml(data.title)}”)` : ""
            } on <strong>${formatDateTimeInTz(
              start,
              data.timezone
            )}</strong> has been received.</p>
<p>I review every request personally. Once I accept it, you&apos;ll get a
confirmation with a calendar invite${
              data.mode === "physical" ? "" : " and a Google Meet link"
            }.</p>`,
          }),
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ ok: true, id: appt.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not submit request." },
      { status: 500 }
    );
  }
}
