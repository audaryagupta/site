import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { emailConfigured, sendBulk } from "@/lib/email";
import { renderGenericEmail } from "@/lib/newsletter";
import { absoluteUrl, escapeHtml } from "@/lib/utils";

// Opt-in new-article notification. Only fires when the admin explicitly hits
// this endpoint from the dashboard — otherwise the article simply appears on
// the site and can be featured in the Weekly Recap.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await guard();
  if (g) return g;

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "SMTP (Google Workspace) email is not configured yet." },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({
    where: { id: params.id },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (article.status !== "published") {
    return NextResponse.json(
      { error: "Publish the article before notifying subscribers." },
      { status: 400 }
    );
  }
  if (article.notifiedAt) {
    return NextResponse.json(
      { error: "Subscribers were already notified about this article." },
      { status: 400 }
    );
  }

  const url = absoluteUrl(`/writings/${article.slug}`);
  const subject = `New writing: ${article.title}`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">I just published a new piece:</p>
    <p style="margin:0 0 8px;font-size:20px;font-weight:600;">${escapeHtml(
      article.title
    )}</p>
    <p style="margin:0 0 20px;color:#6b6863;">${escapeHtml(article.excerpt)}</p>
    <p style="margin:0 0 24px;">
      <a href="${url}" style="display:inline-block;background:#171614;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">Read it →</a>
    </p>`;

  const subs = await prisma.subscriber.findMany({
    where: { status: "active" },
  });
  const recipients = subs.map((s) => ({
    email: s.email,
    firstName: s.firstName,
    token: s.unsubToken,
  }));

  const { sent, errors } = await sendBulk(recipients, (r) => {
    const token = (r as { token?: string }).token || "";
    return {
      subject,
      html: renderGenericEmail({
        firstName: r.firstName,
        subject,
        bodyHtml,
        previewText: article.excerpt,
        unsubUrl: absoluteUrl(`/api/unsubscribe?token=${token}`),
      }),
    };
  });

  await prisma.article.update({
    where: { id: article.id },
    data: { notifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true, sent, failed: errors.length });
}
