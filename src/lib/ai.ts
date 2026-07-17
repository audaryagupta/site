import { getOpenAI, OPENAI_MODEL } from "./openai";
import type { RecapData } from "./newsletter";

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

  const groundingBlock = grounded
    ? `Here are candidate headlines from this week (JSON). Select and rank the 10 most important, mixing international and US stories across business, finance and tech. Use ONLY urls, sources and image links from this list. Do not invent URLs.\n\n${JSON.stringify(
        news.slice(0, 60)
      )}`
    : `No live headline feed is available. Use your knowledge to compile the 10 most likely-important themes in global and US business, finance and tech for the week of ${weekOf}. Leave "url" and "imageUrl" empty strings if you cannot be certain of a real link. Never fabricate specific URLs.`;

  const user = `${groundingBlock}

Return a JSON object with this exact shape:
{
  "intro": "2-3 sentence warm intro to this week's recap",
  "signoff": "one reflective closing sentence",
  "stories": [
    {
      "rank": 1,
      "title": "headline",
      "summary": "2-3 sentence summary explaining why it matters",
      "category": "Finance" | "Business" | "Tech",
      "region": "International" | "United States",
      "source": "publication name or empty",
      "url": "real url or empty string",
      "imageUrl": "real image url or empty string"
    }
  ]
}
Exactly 10 stories, ranked 1-10.`;

  const raw = await chat(system, user, { json: true, temperature: 0.5 });
  let parsed: RecapData;
  try {
    parsed = JSON.parse(raw) as RecapData;
  } catch {
    parsed = {
      intro: "Here are the ten stories that shaped the week.",
      stories: [],
    };
  }
  parsed.stories = (parsed.stories || []).slice(0, 10);
  return { data: parsed, grounded };
}
