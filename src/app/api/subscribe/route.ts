import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { renderGenericEmail } from "@/lib/newsletter";
import { absoluteUrl } from "@/lib/utils";
import { site } from "@/lib/site";
import { isBlacklisted } from "@/lib/mailPolicy";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().max(80).optional().default(""),
});

async function sendWelcome(email: string, firstName: string, unsubToken: string) {
  if (!(await emailConfigured())) return;
  const bodyHtml = `<p>Welcome to the mailing list — I'm so glad you're here.</p>
<p>My commitment is to send you one thoughtful Weekly Recap: the handful of stories that actually mattered in business, finance and tech, distilled into a five-minute read — plus the occasional personal essay. No spam, no noise, and you can unsubscribe anytime.</p>
<p>Talk soon,</p>
<p>— Audarya</p>`;
  try {
    await sendEmail({
      to: email,
      subject: `Welcome to ${site.name}`,
      html: renderGenericEmail({
        firstName,
        subject: `Welcome to ${site.name}`,
        bodyHtml,
        previewText: "My commitment: one thoughtful weekly read — never spam.",
        unsubUrl: absoluteUrl(`/api/unsubscribe?token=${unsubToken}`),
      }),
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

    // Blacklisted addresses can't (re)join the list.
    if (await isBlacklisted(normalized)) {
      return NextResponse.json({
        message: "You're on the list — talk soon.",
      });
    }

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
