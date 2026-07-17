import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, escapeHtml } from "@/lib/utils";
import { site } from "@/lib/site";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().max(80).optional().default(""),
});

async function sendWelcome(email: string, firstName: string, unsubToken: string) {
  if (!emailConfigured()) return;
  const hi = firstName ? ` ${escapeHtml(firstName)}` : "";
  try {
    await sendEmail({
      to: email,
      subject: `Welcome to ${site.name}`,
      html: `<p>Hi${hi},</p>
        <p>Thanks for subscribing to <strong>${site.name}</strong>. Every week you'll get the ten stories that actually mattered in finance, business and tech — internationally and in the US — distilled into a five-minute read.</p>
        <p>You'll also occasionally hear from me with new essays.</p>
        <p>— Audarya</p>
        <p style="font-size:12px;color:#888">Not for you? <a href="${absoluteUrl(
          `/unsubscribe?token=${unsubToken}`
        )}">Unsubscribe anytime</a>.</p>`,
    });
  } catch {
    /* best-effort */
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName } = schema.parse(body);
    const normalized = email.toLowerCase().trim();

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      if (existing.status === "unsubscribed") {
        const reactivated = await prisma.subscriber.update({
          where: { email: normalized },
          data: { status: "active", firstName: firstName || existing.firstName },
        });
        await sendWelcome(
          normalized,
          reactivated.firstName,
          reactivated.unsubToken
        );
      }
      return NextResponse.json({
        message: "You're on the list — talk soon.",
      });
    }

    const created = await prisma.subscriber.create({
      data: { email: normalized, firstName },
    });

    await sendWelcome(normalized, created.firstName, created.unsubToken);

    return NextResponse.json({
      message: "You're in. The next Weekly Recap is headed your way.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
