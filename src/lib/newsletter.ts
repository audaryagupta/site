import { site } from "./site";
import { escapeHtml, absoluteUrl } from "./utils";

function safeUrl(url?: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : "";
}

// Every story is guaranteed a working link: its own source URL when we have
// one, otherwise a Google News search for the headline so readers can always
// click through.
function storyLink(title: string, url?: string): string {
  const clean = safeUrl(url);
  if (clean) return clean;
  return `https://news.google.com/search?q=${encodeURIComponent(title)}`;
}

// A small, stable palette per news category so cards read at a glance.
const CATEGORY: Record<string, { color: string; soft: string; emoji: string }> = {
  finance: { color: "#047857", soft: "#e7f6ef", emoji: "📈" },
  business: { color: "#b45309", soft: "#fdf1e0", emoji: "💼" },
  tech: { color: "#1d4ed8", soft: "#eaf0ff", emoji: "🤖" },
  technology: { color: "#1d4ed8", soft: "#eaf0ff", emoji: "🤖" },
};
function cat(name?: string) {
  return (
    CATEGORY[(name || "").trim().toLowerCase()] || {
      color: "#7c3aed",
      soft: "#f1eafe",
      emoji: "📰",
    }
  );
}

// Each issue picks one theme deterministically from its subject, so consecutive
// recaps look a little different (accent colour, heading font, header GIF,
// emoji) without ever being random from send to send.
interface Theme {
  key: string;
  accent: string;
  soft: string;
  headingFont: string;
  emoji: string;
}
const THEMES: Theme[] = [
  {
    key: "warm",
    accent: "#c2410c",
    soft: "#fff3ea",
    headingFont: "Georgia,'Times New Roman',serif",
    emoji: "📰",
  },
  {
    key: "blue",
    accent: "#1d4ed8",
    soft: "#eaf0ff",
    headingFont: "'Helvetica Neue',Helvetica,Arial,sans-serif",
    emoji: "🗞️",
  },
  {
    key: "green",
    accent: "#047857",
    soft: "#e7f6ef",
    headingFont: "'Iowan Old Style',Palatino,'Book Antiqua',Georgia,serif",
    emoji: "🌿",
  },
  {
    key: "violet",
    accent: "#7c3aed",
    soft: "#f1eafe",
    headingFont: "'Trebuchet MS','Segoe UI',Verdana,sans-serif",
    emoji: "✨",
  },
];
function pickTheme(seedStr: string): Theme {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return THEMES[h % THEMES.length];
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

export interface FeaturedItem {
  title: string;
  blurb?: string;
  url?: string;
  imageUrl?: string;
}

export interface RecapData {
  intro: string;
  signoff?: string;
  stories: RecapStory[];
  // Audarya's own writing to spotlight this week.
  featured?: FeaturedItem[];
  // A free-form personal message shown near the top of the email.
  note?: string;
}

const BG = "#faf8f3";
const INK = "#171614";
const MUTED = "#6b6863";
const LINE = "#e3ddd0";

// Shown at the very top of the first few newsletters sent to people Audarya
// added manually (e.g. merged from her old blog), so they know why they're
// hearing from her.
function addedBanner(): string {
  return `<tr><td style="padding:20px 32px 0;">
<div style="background:${INK};color:#ffffff;border-radius:6px;padding:14px 18px;">
<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.55;">Audarya Gupta has added you to the newsletter. If we've crossed paths — through the old blog or otherwise — this is where the writing continues. You can unsubscribe anytime.</p>
</div></td></tr>`;
}

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
  addedNote?: boolean;
}) {
  const { firstName, subject, data, unsubUrl, addedNote } = opts;
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const theme = pickTheme(subject);
  const headerGif = absoluteUrl(`/newsletter/recap-${theme.key}.gif`);
  const dividerGif = absoluteUrl(`/newsletter/divider-${theme.key}.gif`);

  const stories = data.stories
    .slice(0, 10)
    .map((s) => {
      const link = storyLink(s.title, s.url);
      const c = cat(s.category);
      const imageUrl = safeUrl(s.imageUrl);
      const media = imageUrl
        ? `<a href="${link}" style="text-decoration:none;"><img src="${imageUrl}" width="536" alt="" style="display:block;width:100%;border-radius:8px;border:1px solid ${LINE};margin-bottom:14px;"/></a>`
        : `<a href="${link}" style="text-decoration:none;"><div style="width:100%;border-radius:8px;background:${c.soft};border:1px solid ${LINE};margin-bottom:14px;padding:28px 0;text-align:center;">
<div style="font-size:42px;line-height:1;">${c.emoji}</div>
<div style="margin-top:8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${c.color};">${escapeHtml(s.category)} · ${escapeHtml(s.region)}</div>
</div></a>`;
      return `<tr><td style="padding:0 32px 30px;">
${media}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td valign="top" width="42" style="padding-right:12px;">
<div style="width:30px;height:30px;border-radius:50%;background:${theme.accent};color:#ffffff;text-align:center;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;line-height:30px;">${s.rank}</div>
</td>
<td valign="top">
<span style="display:inline-block;background:${c.soft};color:${c.color};font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:999px;">${c.emoji} ${escapeHtml(s.category)} · ${escapeHtml(s.region)}</span>
<a href="${link}" style="color:${INK};text-decoration:none;"><h2 style="margin:9px 0 8px;font-family:${theme.headingFont};font-size:21px;line-height:1.25;">${escapeHtml(s.title)}</h2></a>
<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(s.summary)}</p>
<a href="${link}" style="display:inline-block;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${theme.accent};text-decoration:none;">Read the full story${s.source ? ` · ${escapeHtml(s.source)}` : ""} →</a>
</td></tr></table>
</td></tr>`;
    })
    .join("\n");

  const note = (data.note || "").trim()
    ? `<tr><td style="padding:0 32px 22px;">
<div style="background:${theme.soft};border-left:4px solid ${theme.accent};border-radius:6px;padding:16px 18px;">
<p style="margin:0;font-size:15px;line-height:1.65;color:${INK};white-space:pre-wrap;">${escapeHtml(
        data.note!.trim()
      )}</p>
</div></td></tr>`
    : "";

  const featured =
    data.featured && data.featured.length
      ? `<tr><td style="padding:8px 32px 4px;">
<p style="margin:0 0 12px;font-family:${theme.headingFont};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${theme.accent};">${theme.emoji} Fresh from ${escapeHtml(
          site.name
        )}</p>
${data.featured
  .map((f) => {
    const url = safeUrl(f.url) || site.url;
    const imageUrl = safeUrl(f.imageUrl);
    const img = imageUrl
      ? `<a href="${url}"><img src="${imageUrl}" width="536" alt="" style="display:block;width:100%;border-radius:8px;border:1px solid ${LINE};margin-bottom:10px;"/></a>`
      : "";
    return `<div style="margin-bottom:18px;">
${img}
<a href="${url}" style="color:${INK};text-decoration:none;"><h2 style="margin:0 0 6px;font-family:${theme.headingFont};font-size:19px;line-height:1.3;">${escapeHtml(
      f.title
    )}</h2></a>
${
  f.blurb
    ? `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(
        f.blurb
      )}</p>`
    : ""
}
<a href="${url}" style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${theme.accent};text-decoration:none;">Read the piece →</a>
</div>`;
  })
  .join("\n")}
</td></tr>`
      : "";

  const inner = `
${addedNote ? addedBanner() : ""}
<tr><td style="padding:0;"><img src="${headerGif}" width="600" alt="" style="display:block;width:100%;"/></td></tr>
<tr><td style="padding:24px 32px 4px;text-align:center;">
<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${theme.accent};">${theme.emoji}&nbsp; The Weekly Recap &nbsp;${theme.emoji}</p>
<h1 style="margin:10px 0 0;font-family:${theme.headingFont};font-size:32px;line-height:1.12;color:${INK};">${escapeHtml(subject)}</h1>
</td></tr>
<tr><td style="padding:18px 32px 10px;">
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${greeting}</p>
<p style="margin:0;font-size:17px;line-height:1.7;color:${INK};">${escapeHtml(data.intro)}</p>
</td></tr>
${note}
${featured}
<tr><td style="padding:6px 32px 14px;">
<img src="${dividerGif}" width="536" alt="" style="display:block;width:100%;margin-bottom:16px;"/>
<p style="margin:0;font-family:${theme.headingFont};font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${theme.accent};">The ten stories that mattered</p>
</td></tr>
${stories}
${
  data.signoff
    ? `<tr><td style="padding:2px 32px 30px;"><img src="${dividerGif}" width="536" alt="" style="display:block;width:100%;margin-bottom:18px;"/><p style="margin:0;font-size:16px;line-height:1.6;font-style:italic;color:${MUTED};">${escapeHtml(data.signoff)}</p><p style="margin:12px 0 0;font-family:${theme.headingFont};font-size:17px;color:${INK};">— Audarya Gupta</p></td></tr>`
    : `<tr><td style="padding:2px 32px 30px;"><p style="margin:0;font-family:${theme.headingFont};font-size:17px;color:${INK};">— Audarya Gupta</p></td></tr>`
}`;

  return shell(inner, unsubUrl, data.intro.slice(0, 140));
}

export function renderGenericEmail(opts: {
  firstName?: string;
  subject: string;
  bodyHtml: string;
  unsubUrl: string;
  previewText?: string;
  addedNote?: boolean;
}) {
  const { firstName, subject, bodyHtml, unsubUrl, previewText, addedNote } =
    opts;
  const greeting = firstName ? `<p style="margin:0 0 16px;font-size:16px;">Hi ${escapeHtml(firstName)},</p>` : "";
  const inner = `
${addedNote ? addedBanner() : ""}
<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0;font-size:28px;line-height:1.2;">${escapeHtml(subject)}</h1>
</td></tr>
<tr><td style="padding:16px 32px 28px;font-size:16px;line-height:1.7;color:${INK};">
${greeting}
${bodyHtml}
</td></tr>`;
  return shell(inner, unsubUrl, previewText || subject);
}
