import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { verifyCaptcha } from "@/lib/captcha";
import { absoluteUrl, escapeHtml, formatDateTime } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional().default(""),
  purpose: z.string().trim().max(2000).optional().default(""),
  mode: z.enum(["meet", "zoom", "physical"]).default("meet"),
  date: z.string().min(1),
  time: z.string().min(1),
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

    // Interpret the requester's chosen date/time as IST (Asia/Kolkata).
    const start = new Date(`${data.date}T${data.time}:00+05:30`);
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
        mode: data.mode,
        requestedStart: start,
        requestedEnd: end,
      },
    });

    if (emailConfigured()) {
      // Notify the admin
      if (process.env.ADMIN_EMAIL) {
        try {
          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            replyTo: data.email,
            subject: `New appointment request from ${data.name}`,
            html: `<p><strong>${escapeHtml(data.name)}</strong> requested a ${
              data.mode
            } meeting.</p>
            <p>When: ${formatDateTime(start)} IST (${data.duration} min)<br/>
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
      // Acknowledge the requester
      try {
        await sendEmail({
          to: data.email,
          subject: "Your appointment request was received",
          html: `<p>Hi ${escapeHtml(data.name)},</p>
          <p>Thanks — your request for a <strong>${
            data.mode === "physical" ? "in-person" : data.mode
          } meeting</strong> on <strong>${formatDateTime(
            start
          )} IST</strong> has been received.</p>
          <p>I review every request personally. Once I accept it, you&apos;ll
          get a confirmation with a calendar invite and the meeting details.</p>
          <p>— Audarya</p>`,
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
