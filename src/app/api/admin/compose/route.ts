import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/adminApi";
import { sendBulk } from "@/lib/email";
import { getBrandAssets, renderBrandedEmail } from "@/lib/emailTemplate";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

const schema = z.object({
  subject: z.string().trim().min(1).max(300),
  bodyHtml: z.string().trim().min(1),
  recipients: z.array(z.string().trim().email()).min(1).max(2000),
  includeBanner: z.boolean().optional(),
  includeSignature: z.boolean().optional(),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // De-dupe recipients.
  const recipients = Array.from(
    new Set(data.recipients.map((e) => e.toLowerCase().trim()))
  ).map((email) => ({ email }));

  const assets = await getBrandAssets();
  const html = renderBrandedEmail({
    bodyHtml: data.bodyHtml,
    bannerUrl: data.includeBanner === false ? undefined : assets.bannerUrl,
    signatureHtml:
      data.includeSignature === false ? undefined : assets.signatureHtml,
    footer: true,
    preheader: data.subject,
  });

  // Composed mail is intentional → personal mailbox (audarya@byaudarya.com).
  const { sent, errors } = await sendBulk(
    recipients,
    () => ({ subject: data.subject, html }),
    "personal"
  );

  await logActivity(
    "email.composed_sent",
    `Sent "${data.subject}" to ${sent}/${recipients.length} recipient(s)`
  );

  return NextResponse.json({ ok: true, sent, total: recipients.length, errors });
}
