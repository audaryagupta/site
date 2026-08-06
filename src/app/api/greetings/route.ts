import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, escapeHtml } from "@/lib/utils";

const schema = z.object({
  requesterName: z.string().trim().min(1).max(120),
  requesterEmail: z.string().email(),
  occasion: z.enum(["birthday", "anniversary"]).default("birthday"),
  forName: z.string().trim().max(120).optional().default(""),
  onDate: z.string().optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const onDate = data.onDate ? new Date(data.onDate) : null;

    const greeting = await prisma.greetingRequest.create({
      data: {
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        occasion: data.occasion,
        forName: data.forName,
        onDate: onDate && !isNaN(onDate.getTime()) ? onDate : null,
        message: data.message,
      },
    });

    if (await emailConfigured() && process.env.ADMIN_EMAIL) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          account: "personal",
          replyTo: data.requesterEmail,
          subject: `Greeting request (${data.occasion}) from ${data.requesterName}`,
          html: `<p><strong>${escapeHtml(
            data.requesterName
          )}</strong> requested a ${escapeHtml(data.occasion)} greeting${
            data.forName ? ` for <strong>${escapeHtml(data.forName)}</strong>` : ""
          }.</p>
          ${data.onDate ? `<p>Date: ${escapeHtml(data.onDate)}</p>` : ""}
          <p>Note: ${escapeHtml(data.message) || "—"}</p>
          <p><a href="${absoluteUrl(
            "/admin/greetings"
          )}">Review in dashboard →</a></p>`,
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ ok: true, id: greeting.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please complete the required fields." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not submit request." },
      { status: 500 }
    );
  }
}
