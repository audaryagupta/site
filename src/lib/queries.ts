import { prisma } from "./prisma";
import { quoteRounds as staticRounds, type QuoteRound } from "./quotes";

/**
 * Builds "Who said it?" rounds from the admin-managed quote bank: each round is
 * one of Audarya's quotes plus two famous ones (shuffled). Falls back to the
 * built-in set when there aren't enough quotes in the database yet.
 */
export async function buildQuoteRounds(max = 6): Promise<QuoteRound[]> {
  const [mine, others] = await Promise.all([
    prisma.quote.findMany({ where: { mine: true, active: true } }),
    prisma.quote.findMany({ where: { mine: false, active: true } }),
  ]);

  if (mine.length < 1 || others.length < 2) return staticRounds;

  const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
  const mineS = shuffle(mine);
  const rounds: QuoteRound[] = [];

  for (let i = 0; i < Math.min(max, mineS.length); i++) {
    const two = shuffle(others).slice(0, 2);
    const opts = shuffle([mineS[i].text, two[0].text, two[1].text]);
    rounds.push({ options: opts, mine: opts.indexOf(mineS[i].text) });
  }
  return rounds.length ? rounds : staticRounds;
}

export async function getPublishedArticles(opts?: {
  topic?: string;
  take?: number;
  skip?: number;
}) {
  return prisma.article.findMany({
    where: {
      status: "published",
      ...(opts?.topic
        ? { tags: { some: { slug: opts.topic } } }
        : {}),
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
    take: opts?.take,
    skip: opts?.skip,
  });
}

export async function getFeaturedArticle() {
  return prisma.article.findFirst({
    where: { status: "published", featured: true },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: { tags: true },
  });
}

export async function getUsedTopics() {
  const tags = await prisma.tag.findMany({
    where: { articles: { some: { status: "published" } } },
    orderBy: { name: "asc" },
  });
  return tags;
}

export async function getRelatedArticles(articleId: string, tagIds: string[]) {
  if (tagIds.length === 0) {
    return prisma.article.findMany({
      where: { status: "published", id: { not: articleId } },
      include: { tags: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  }
  return prisma.article.findMany({
    where: {
      status: "published",
      id: { not: articleId },
      tags: { some: { id: { in: tagIds } } },
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export async function getReadingItems() {
  return prisma.readingItem.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
}

export async function getSentNewsletters() {
  return prisma.newsletter.findMany({
    where: { status: "sent" },
    orderBy: { sentAt: "desc" },
  });
}

export interface LatestRecapStory {
  rank: number;
  title: string;
  summary: string;
  category: string;
  region: string;
  source?: string;
  url?: string;
  imageUrl?: string;
}

// The news stories from the most recent Weekly Recap that actually went out,
// so the public "Now" page can mirror what subscribers just received.
export async function getLatestRecap(): Promise<{
  id: string;
  subject: string;
  sentAt: Date | null;
  stories: LatestRecapStory[];
} | null> {
  const nl = await prisma.newsletter.findFirst({
    where: { status: "sent", type: "recap", NOT: { dataJson: null } },
    orderBy: { sentAt: "desc" },
  });
  if (!nl || !nl.dataJson) return null;
  let stories: LatestRecapStory[] = [];
  try {
    const parsed = JSON.parse(nl.dataJson) as { stories?: LatestRecapStory[] };
    stories = (parsed.stories || []).slice(0, 10);
  } catch {
    stories = [];
  }
  if (!stories.length) return null;
  return { id: nl.id, subject: nl.subject, sentAt: nl.sentAt, stories };
}

export async function getPublicAvailability() {
  // Weekly default windows the visitor can book (recurring, startDate == "").
  return prisma.availability.findMany({
    where: { active: true, status: "available", startDate: "" },
    orderBy: [{ kind: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

// Special date-range windows (both available and unavailable) that override the
// weekly default for the dates they cover. Returned to the booker so it can
// open special hours or block ranges (e.g. travel/holidays) per date.
export async function getSpecialAvailability() {
  return prisma.availability.findMany({
    where: { active: true, NOT: { startDate: "" } },
    orderBy: [{ startDate: "asc" }, { kind: "asc" }, { startTime: "asc" }],
  });
}

export async function getSetting(key: string, fallback = "") {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function getSettings(keys: string[]) {
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}
