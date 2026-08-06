import { prisma } from "./prisma";
import { absoluteUrl } from "./utils";

// Owner-editable email branding: a banner image shown at the top of composed /
// greeting mail and an HTML signature appended at the bottom. Stored as plain
// Setting rows so they persist and are editable from Studio → Email.
export interface BrandAssets {
  bannerUrl: string;
  signatureHtml: string;
}

export async function getBrandAssets(): Promise<BrandAssets> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["email_banner_url", "email_signature_html"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    bannerUrl: (map["email_banner_url"] || "").trim(),
    signatureHtml: (map["email_signature_html"] || "").trim(),
  };
}

// Make root-relative src/href (e.g. uploaded /api/uploads/...) absolute so they
// resolve inside an email client.
function absolutize(html: string): string {
  return html.replace(
    /(src|href)=("|')(\/[^"']*)(\2)/gi,
    (_m, attr, q, path) => `${attr}=${q}${absoluteUrl(path)}${q}`
  );
}

export interface RenderOpts {
  bodyHtml: string;
  bannerUrl?: string;
  signatureHtml?: string;
  /** Show the small "sent by byAudarya" footer with the site link. */
  footer?: boolean;
  /** Optional preheader (hidden preview text shown in the inbox list). */
  preheader?: string;
}

/**
 * Wraps composed/greeting body HTML in a polished, table-based, inline-styled
 * email that renders consistently across clients (banner → content → signature
 * → footer). Root-relative asset URLs are made absolute.
 */
export function renderBrandedEmail(opts: RenderOpts): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byaudarya.com";
  const banner = opts.bannerUrl
    ? absolutize(
        `<tr><td style="padding:0;"><a href="${site}"><img src="${opts.bannerUrl}" alt="byAudarya" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:12px 12px 0 0;" /></a></td></tr>`
      )
    : "";
  const signature = opts.signatureHtml
    ? absolutize(
        `<tr><td style="padding:8px 32px 0;"><div style="border-top:1px solid #eceae4;margin-top:8px;padding-top:20px;color:#4a4a48;font-size:14px;line-height:1.6;">${opts.signatureHtml}</div></td></tr>`
      )
    : "";
  const footer = opts.footer
    ? `<tr><td style="padding:24px 32px 32px;color:#9a978f;font-size:12px;line-height:1.6;text-align:center;">
        <a href="${site}" style="color:#9a978f;text-decoration:none;">byaudarya.com</a>
      </td></tr>`
    : "";
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
</head>
<body style="margin:0;padding:0;background:#f4f2ec;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ec;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${banner}
        <tr>
          <td style="padding:32px 32px 8px;color:#1a1a18;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;">
            ${absolutize(opts.bodyHtml)}
          </td>
        </tr>
        ${signature}
        ${footer}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
