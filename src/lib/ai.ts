import { getOpenAI, OPENAI_MODEL } from "./openai";
import type { RecapData } from "./newsletter";
import { withTopicImages } from "./topicImages";
import { directArticleUrl } from "./utils";

async function chat(
  system: string,
  user: string,
  opts?: { json?: boolean; temperature?: number }
): Promise<string> {
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: opts?.temperature ?? 0.6,
    response_format: opts?.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || "";
}

/* -------------------- Writing assistant -------------------- */

export type AssistMode =
  | "draft"
  | "improve"
  | "shorten"
  | "expand"
  | "title"
  | "excerpt"
  | "continue";

const ASSIST_PROMPTS: Record<AssistMode, string> = {
  draft:
    "Write a thoughtful, well-structured essay draft in clean HTML (use <h2>, <p>, <blockquote>, <ul>). Match a smart, curious, personal editorial voice. Do not include <html> or <body> tags.",
  improve:
    "Improve the clarity, flow and style of the following HTML while preserving meaning and the author's voice. Return clean HTML only, no <html>/<body> wrapper.",
  shorten:
    "Tighten and shorten the following HTML while keeping the key ideas and the author's voice. Return clean HTML only.",
  expand:
    "Expand the following HTML with richer detail, examples and transitions, keeping the author's voice. Return clean HTML only.",
  title:
    "Suggest one excellent, specific, non-clickbait title for the following piece. Return only the title text, no quotes.",
  excerpt:
    "Write a compelling 1-2 sentence excerpt (max 200 chars) summarising the following piece. Return only the excerpt text.",
  continue:
    "Continue writing the following piece naturally in the same voice, adding 1-3 paragraphs. Return clean HTML only.",
};

export async function assistWriting(
  mode: AssistMode,
  content: string,
  instruction?: string
): Promise<string> {
  const system =
    "You are the writing assistant for Audarya Gupta's personal blog on finance, tech, business and world affairs. Write in a smart, warm, curious, first-person editorial voice.";
  const task = ASSIST_PROMPTS[mode];
  const user = `${task}${
    instruction ? `\n\nAdditional instruction: ${instruction}` : ""
  }\n\n---\n${content || "(no content yet)"}`;
  return chat(system, user, { temperature: 0.7 });
}

/* -------------------- Translation -------------------- */

const LANG_NAMES: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  fr: "French",
  es: "Spanish",
  sa: "Sanskrit",
};

export async function translateHtml(
  html: string,
  targetLang: string
): Promise<string> {
  const langName = LANG_NAMES[targetLang] || targetLang;
  const system = `You are an expert literary translator. Translate the user's HTML into ${langName}, preserving all HTML tags and structure exactly. Translate only the visible text, keep the author's tone. Return only the translated HTML.`;
  return chat(system, html, { temperature: 0.3 });
}

/* -------------------- Weekly news recap -------------------- */

// Outlets to exclude from the recap — overly political / general-news channels.
const BLOCKED_SOURCES = [
  "bbc",
  "al jazeera",
  "aljazeera",
  "fox news",
  "foxnews",
  "breitbart",
  "the daily wire",
  "dailywire",
  "msnbc",
  "newsmax",
  "one america",
  "oann",
  "rt.com",
  "russia today",
  "sputnik",
];

function isBlockedSource(name?: string, url?: string): boolean {
  const hay = `${name || ""} ${url || ""}`.toLowerCase();
  return BLOCKED_SOURCES.some((s) => hay.includes(s));
}

// "No bad news": drop headlines that are fundamentally about tragedy, violence,
// death, war or disaster. Kept deliberately narrow so ordinary business/tech
// news (a stock "crash", a product "kill", layoffs) still comes through.
const BAD_NEWS_PATTERNS = [
  /\bkilled\b/,
  /\bkilling\b/,
  /\bdead\b/,
  /\bdeath(s)?\b/,
  /\bdies\b/,
  /\bdied\b/,
  /\bmurder/,
  /\bshooting\b/,
  /\bshot dead\b/,
  /\bstabb/,
  /\bterror/,
  /\bmassacre\b/,
  /\bwar\b/,
  /\bwarfare\b/,
  /\bairstrike/,
  /\bmissile\b/,
  /\bbombing\b/,
  /\bgenocide\b/,
  /\bhostage/,
  /\bearthquake\b/,
  /\btsunami\b/,
  /\bwildfire\b/,
  /\bhurricane\b/,
  /\bfloods?\b/,
  /\bplane crash\b/,
  /\bcrash(es)? kill/,
  /\bfatal\b/,
  /\bcasualt/,
  /\brape\b/,
  /\babuse\b/,
  /\bsuicide\b/,
];

function isBadNews(title?: string, description?: string): boolean {
  const hay = `${title || ""} ${description || ""}`.toLowerCase();
  return BAD_NEWS_PATTERNS.some((re) => re.test(hay));
}

async function fetchNews(): Promise<
  { title: string; description: string; url: string; image?: string; source?: string }[]
> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  const categories = ["business", "technology"];
  const all: {
    title: string;
    description: string;
    url: string;
    image?: string;
    source?: string;
  }[] = [];
  for (const country of ["us", ""]) {
    for (const category of categories) {
      try {
        const params = new URLSearchParams({
          category,
          pageSize: "20",
          apiKey: key,
          language: "en",
        });
        if (country) params.set("country", country);
        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?${params.toString()}`
        );
        if (!res.ok) continue;
        const data = (await res.json()) as {
          articles?: {
            title: string;
            description?: string;
            url: string;
            urlToImage?: string;
            source?: { name?: string };
          }[];
        };
        for (const a of data.articles || []) {
          if (!a.title || !a.url) continue;
          if (isBlockedSource(a.source?.name, a.url)) continue;
          if (isBadNews(a.title, a.description)) continue;
          all.push({
            title: a.title,
            description: a.description || "",
            url: a.url,
            image: a.urlToImage || undefined,
            source: a.source?.name,
          });
        }
      } catch {
        // ignore source errors
      }
    }
  }
  return all;
}

export async function generateRecap(): Promise<{
  data: RecapData;
  grounded: boolean;
}> {
  const news = await fetchNews();
  const grounded = news.length > 0;

  const weekOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const system = `You are the editor of "The Weekly Recap", a weekly newsletter by Audarya Gupta covering the most important news in business, finance and technology — both international and United States. You write with insight, concision and a warm personal voice.`;

  const sourceGuidance = `ONLY use highly reputable AND FREELY-ACCESSIBLE (no paywall) business/finance/tech sources whose article pages open in full without a subscription — e.g. Reuters, Associated Press, CNBC, The Verge, TechCrunch, Ars Technica, Yahoo Finance, and official company/government/regulator press releases. AVOID hard-paywalled outlets whose links dead-end at a subscription wall — do NOT link to The Wall Street Journal, Financial Times, Bloomberg, The Economist, The New York Times, or The Information. NEVER use the BBC (bbc.com / bbc.co.uk) under any circumstances — it is blacklisted. Also avoid sensational or politically-slanted general-news channels (Al Jazeera, Fox News, tabloids, blogs). Every story's "url" MUST be a real, direct link to the specific free article — never a homepage, never a search page.`;

  const toneGuidance = `This is a POSITIVE, forward-looking business/finance/tech briefing — NO BAD NEWS. Do NOT include stories that are fundamentally about death, violence, war, crime, terrorism, disasters, tragedy or human suffering. Focus on markets, companies, deals, products, innovation, policy and the economy. If a week's only notable events are grim, prefer quieter constructive stories over tragic ones.`;

  const imageGuidance = `Always leave "imageUrl" as an empty string — do not supply any image. Open-license photos are added automatically after the fact, so never include a photo URL yourself.`;

  const groundingBlock = grounded
    ? `Here are candidate headlines from this week (JSON). Select and rank the 7 most important, mixing international and US stories across business, finance and tech. ${sourceGuidance} ${toneGuidance} Use ONLY article urls and sources from this list (do not invent article URLs). ${imageGuidance}\n\n${JSON.stringify(
        news.slice(0, 60)
      )}`
    : `No live headline feed is available. Use your knowledge to compile the 7 most likely-important themes in global and US business, finance and tech for the week of ${weekOf}. ${sourceGuidance} ${toneGuidance} Leave "url" empty if you cannot be certain of a real free article link. Never fabricate specific article URLs. ${imageGuidance}`;

  const user = `${groundingBlock}

Write the intro in Audarya's first-person voice. It MUST open by naming the mood of the week in a natural way, then say what caught her attention — e.g. "It was a slow week — but a few things still had my attention:" or "What an interesting week. This week my attention was on:". Keep it 2-3 sentences, warm and specific, no emojis.

Also classify the week's overall mood as one of exactly: "slow" (quiet news week), "interesting" (a normal-to-lively week), "busy" (a lot happened), or "heavy" (ONLY if a genuinely global CULTURAL icon — a legendary figure like Messi or Pelé, never a politician — passed away this week). Default to "interesting" if unsure. Never mark a week "heavy" for a politician's death or ordinary bad news.

Return a JSON object with this exact shape:
{
  "intro": "2-3 sentence first-person intro that opens with the week's mood and 'this week my attention was on…' phrasing",
  "mood": "slow" | "interesting" | "busy" | "heavy",
  "signoff": "one short reflective closing sentence (no sign-off name)",
  "stories": [
    {
      "rank": 1,
      "title": "headline",
      "summary": "2-3 sentence summary explaining why it matters",
      "category": "Finance" | "Business" | "Tech",
      "region": "International" | "United States",
      "source": "publication name or empty",
      "url": "real direct free-article url or empty string",
      "imageUrl": "real image url or empty string"
    }
  ]
}
Exactly 7 stories, ranked 1-7.`;

  const raw = await chat(system, user, { json: true, temperature: 0.5 });
  let parsed: RecapData;
  try {
    parsed = JSON.parse(raw) as RecapData;
  } catch {
    parsed = {
      intro:
        "It was an interesting week — this week my attention was on the stories below.",
      mood: "interesting",
      stories: [],
    };
  }
  if (!parsed.mood) parsed.mood = "interesting";

  // Only real headlines from the live feed carry a URL, and only when that URL
  // is a direct link to the source's own article page. Anything the model may
  // have invented (or any aggregator/homepage link) is dropped so a reader
  // never hits a dead or redirected link. Article photos are discarded too —
  // images are added afterwards from an open-license set only.
  const allowedUrls = new Set(news.map((n) => n.url.trim()));
  const cleaned = (parsed.stories || []).slice(0, 7).map((s) => {
    const url = (s.url || "").trim();
    const keepUrl =
      grounded && allowedUrls.has(url) ? directArticleUrl(url) : "";
    return { ...s, url: keepUrl, imageUrl: "" };
  });
  parsed.stories = withTopicImages(cleaned, 2);
  return { data: parsed, grounded };
}
