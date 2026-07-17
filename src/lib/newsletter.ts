import { site } from "./site";
import { escapeHtml } from "./utils";

function safeUrl(url?: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : "";
}

export interface RecapStory {
  rank: number;
  title: string;
  summary: string;
  category: string;
  region: string; // "International" | "United States"
  source?: string;
  url?: string;
  imageUrl?: string;
}

export interface RecapData {
  intro: string;
  signoff?: string;
  stories: RecapStory[];
}

const BG = "#faf8f3";
const INK = "#171614";
const MUTED = "#6b6863";
const LINE = "#e3ddd0";

function shell(inner: string, unsubUrl: string, preview: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:Georgia,'Times New Roman',serif;color:${INK};">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">${preview}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border:1px solid ${LINE};border-radius:6px;overflow:hidden;">
${inner}
<tr><td style="padding:24px 32px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;font-family:Arial,sans-serif;text-align:center;">
<p style="margin:0 0 6px;">${site.name} — ${site.tagline}</p>
<p style="margin:0;"><a href="${unsubUrl}" style="color:${MUTED};">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function renderRecapEmail(opts: {
  firstName?: string;
  subject: string;
  data: RecapData;
  unsubUrl: string;
}) {
  const { firstName, subject, data, unsubUrl } = opts;
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";

  const stories = data.stories
    .slice(0, 10)
    .map((s) => {
      const url = safeUrl(s.url);
      const imageUrl = safeUrl(s.imageUrl);
      const img = imageUrl
        ? `<a href="${url || "#"}" style="text-decoration:none;"><img src="${imageUrl}" width="536" alt="" style="width:100%;border-radius:4px;border:1px solid ${LINE};margin-bottom:12px;"/></a>`
        : "";
      return `<tr><td style="padding:0 32px 26px;">
${img}
<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">${s.rank}. ${escapeHtml(s.category)} · ${escapeHtml(s.region)}</p>
<a href="${url || "#"}" style="color:${INK};text-decoration:none;"><h2 style="margin:0 0 8px;font-size:20px;line-height:1.25;">${escapeHtml(s.title)}</h2></a>
<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(s.summary)}</p>
${url ? `<a href="${url}" style="font-family:Arial,sans-serif;font-size:13px;color:${INK};">Read more${s.source ? ` · ${escapeHtml(s.source)}` : ""} →</a>` : ""}
</td></tr>`;
    })
    .join("\n");

  const inner = `
<tr><td style="padding:32px 32px 8px;">
<p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">The Weekly Recap</p>
<h1 style="margin:8px 0 0;font-size:30px;line-height:1.15;">${escapeHtml(subject)}</h1>
</td></tr>
<tr><td style="padding:16px 32px 24px;">
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${greeting}</p>
<p style="margin:0;font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(data.intro)}</p>
</td></tr>
<tr><td style="padding:0 32px 8px;"><hr style="border:0;border-top:1px solid ${LINE};"/></td></tr>
${stories}
${
  data.signoff
    ? `<tr><td style="padding:8px 32px 28px;"><hr style="border:0;border-top:1px solid ${LINE};margin-bottom:20px;"/><p style="margin:0;font-size:16px;line-height:1.6;font-style:italic;color:${MUTED};">${escapeHtml(data.signoff)}</p><p style="margin:12px 0 0;font-size:16px;">— Audarya</p></td></tr>`
    : ""
}`;

  return shell(inner, unsubUrl, data.intro.slice(0, 140));
}

export function renderGenericEmail(opts: {
  firstName?: string;
  subject: string;
  bodyHtml: string;
  unsubUrl: string;
  previewText?: string;
}) {
  const { firstName, subject, bodyHtml, unsubUrl, previewText } = opts;
  const greeting = firstName ? `<p style="margin:0 0 16px;font-size:16px;">Hi ${escapeHtml(firstName)},</p>` : "";
  const inner = `
<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0;font-size:28px;line-height:1.2;">${escapeHtml(subject)}</h1>
</td></tr>
<tr><td style="padding:16px 32px 28px;font-size:16px;line-height:1.7;color:${INK};">
${greeting}
${bodyHtml}
</td></tr>`;
  return shell(inner, unsubUrl, previewText || subject);
}
