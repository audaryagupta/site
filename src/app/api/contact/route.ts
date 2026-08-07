import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    await prisma.contactMessage.create({ data });

    // Notify the admin (best-effort)
    if (await emailConfigured() && process.env.ADMIN_EMAIL) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          replyTo: data.email,
          subject: `New message from ${data.name}`,
          html: `<p><strong>${escapeHtml(data.name)}</strong> (${escapeHtml(
            data.email
          )}${
            data.phone ? `, ${escapeHtml(data.phone)}` : ""
          }) wrote:</p><p>${escapeHtml(data.message).replace(
            /\n/g,
            "<br/>"
          )}</p>`,
        });
      } catch {
        // ignore email failures; message is stored regardless
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to send." }, { status: 500 });
  }
}
