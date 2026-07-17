import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOpenAI } from "@/lib/openai";
import { generateRecap } from "@/lib/ai";
import { renderRecapEmail } from "@/lib/newsletter";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasOpenAI()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 400 }
    );
  }

  const { data } = await generateRecap();
  // The recap is scheduled for Friday 8:00 AM US Eastern (see fly.toml / cron).
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const subject = `The Friday Recap — ${dateLabel}`;
  const previewHtml = renderRecapEmail({ subject, data, unsubUrl: "#" });

  // Draft is created in "pending_approval" — nothing is sent to subscribers.
  const nl = await prisma.newsletter.create({
    data: {
      type: "recap",
      subject,
      previewText: data.intro.slice(0, 140),
      contentHtml: previewHtml,
      dataJson: JSON.stringify(data),
      status: "pending_approval",
      audience: "subscribers",
    },
  });

  // Notify Audarya to review & approve.
  if (emailConfigured() && process.env.ADMIN_EMAIL) {
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `[Approve] ${subject} is ready for review`,
        html: `<p>This week's Friday Recap draft is ready.</p>
        <p>Review, edit and approve it before it goes out:</p>
        <p><a href="${absoluteUrl(
          `/admin/newsletters/${nl.id}`
        )}">Open in studio →</a></p>`,
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, id: nl.id });
}
