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

// Each issue picks one heading font deterministically from its subject, so
// consecutive recaps look a little different without ever being random from
// send to send. Colour never varies — the palette stays black/white + cream;
// all the colour in the email comes from the article photographs.
const HEADING_FONTS = [
  "Georgia,'Times New Roman',serif",
  "'Iowan Old Style',Palatino,'Book Antiqua',Georgia,serif",
  "'Helvetica Neue',Helvetica,Arial,sans-serif",
  "'Trebuchet MS','Segoe UI',Verdana,sans-serif",
];
function pickHeadingFont(seedStr: string): string {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return HEADING_FONTS[h % HEADING_FONTS.length];
}

// The week's mood drives the header GIF + a short kicker line. Politicians'
// deaths never make a week "heavy" — only a legendary global cultural icon.
type Mood = "slow" | "interesting" | "busy" | "heavy";
const MOODS: Record<Mood, { kicker: string }> = {
  slow: { kicker: "A slow week." },
  interesting: { kicker: "An interesting week." },
  busy: { kicker: "A busy week." },
  heavy: { kicker: "A heavy week." },
};
function moodOf(m?: string): Mood {
  const k = (m || "").trim().toLowerCase();
  return k === "slow" || k === "busy" || k === "heavy" ? k : "interesting";
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
  mood?: Mood;
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
// Warm cream used for chips / soft panels — the only non-white fill, so the
// email stays black/white + cream and lets the photos carry all the colour.
const CREAM = "#f1ece1";

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
  const greeting = firstName ? `Hey ${escapeHtml(firstName)},` : "Hey there,";
  const headingFont = pickHeadingFont(subject);
  const mood = moodOf(data.mood);
  const headerGif = absoluteUrl(`/newsletter/recap-${mood}.gif`);
  const dividerGif = absoluteUrl(`/newsletter/divider.gif`);

  // Tiny caption crediting a photo source in small text.
  const photoCredit = (source?: string) =>
    source
      ? `<p style="margin:-8px 0 14px;font-family:Arial,sans-serif;font-size:10px;line-height:1.4;color:${MUTED};">Photo: ${escapeHtml(
          source
        )}</p>`
      : "";

  const stories = data.stories
    .slice(0, 10)
    .map((s) => {
      const link = storyLink(s.title, s.url);
      const imageUrl = safeUrl(s.imageUrl);
      // The photo is the only colour on the card and clicking it (or the
      // headline) goes straight to the story — no "read more" link.
      const media = imageUrl
        ? `<a href="${link}" style="text-decoration:none;"><img src="${imageUrl}" width="536" alt="" style="display:block;width:100%;border-radius:8px;border:1px solid ${LINE};margin-bottom:14px;"/></a>
${photoCredit(s.source)}`
        : "";
      return `<tr><td style="padding:0 32px 30px;">
${media}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td valign="top" width="42" style="padding-right:12px;">
<div style="width:30px;height:30px;border-radius:50%;background:${INK};color:#ffffff;text-align:center;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;line-height:30px;">${s.rank}</div>
</td>
<td valign="top">
<span style="display:inline-block;background:${CREAM};color:${INK};font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:999px;">${escapeHtml(s.category)} · ${escapeHtml(s.region)}</span>
<a href="${link}" style="color:${INK};text-decoration:none;"><h2 style="margin:9px 0 8px;font-family:${headingFont};font-size:21px;line-height:1.25;">${escapeHtml(s.title)}</h2></a>
<p style="margin:0;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(s.summary)}</p>
${
  !imageUrl && s.source
    ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:10px;color:${MUTED};">Source: ${escapeHtml(
        s.source
      )}</p>`
    : ""
}
</td></tr></table>
</td></tr>`;
    })
    .join("\n");

  const note = (data.note || "").trim()
    ? `<tr><td style="padding:0 32px 22px;">
<div style="background:${CREAM};border-left:4px solid ${INK};border-radius:6px;padding:16px 18px;">
<p style="margin:0;font-size:15px;line-height:1.65;color:${INK};white-space:pre-wrap;">${escapeHtml(
        data.note!.trim()
      )}</p>
</div></td></tr>`
    : "";

  const featured =
    data.featured && data.featured.length
      ? `<tr><td style="padding:8px 32px 4px;">
<p style="margin:0 0 12px;font-family:${headingFont};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${INK};">Fresh from ${escapeHtml(
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
<a href="${url}" style="color:${INK};text-decoration:none;"><h2 style="margin:0 0 6px;font-family:${headingFont};font-size:19px;line-height:1.3;">${escapeHtml(
      f.title
    )}</h2></a>
${
  f.blurb
    ? `<p style="margin:0;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(
        f.blurb
      )}</p>`
    : ""
}
</div>`;
  })
  .join("\n")}
</td></tr>`
      : "";

  const inner = `
${addedNote ? addedBanner() : ""}
<tr><td style="padding:0;"><img src="${headerGif}" width="600" alt="" style="display:block;width:100%;"/></td></tr>
<tr><td style="padding:24px 32px 4px;text-align:center;">
<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">${MOODS[mood].kicker}&nbsp;&nbsp;The Weekly Recap</p>
<h1 style="margin:10px 0 0;font-family:${headingFont};font-size:32px;line-height:1.12;color:${INK};">${escapeHtml(subject)}</h1>
</td></tr>
<tr><td style="padding:18px 32px 10px;">
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${greeting}</p>
<p style="margin:0;font-size:17px;line-height:1.7;color:${INK};">${escapeHtml(data.intro)}</p>
</td></tr>
${note}
${featured}
<tr><td style="padding:6px 32px 14px;">
<img src="${dividerGif}" width="536" alt="" style="display:block;width:100%;margin-bottom:16px;"/>
<p style="margin:0;font-family:${headingFont};font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${INK};">The ten stories that mattered</p>
</td></tr>
${stories}
<tr><td style="padding:2px 32px 30px;"><img src="${dividerGif}" width="536" alt="" style="display:block;width:100%;margin-bottom:18px;"/>${
    data.signoff
      ? `<p style="margin:0 0 10px;font-size:16px;line-height:1.6;font-style:italic;color:${MUTED};">${escapeHtml(
          data.signoff
        )}</p>`
      : ""
  }<p style="margin:0;font-family:${headingFont};font-size:18px;color:${INK};">Loved compiling this for you!! — Audi</p></td></tr>`;

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
