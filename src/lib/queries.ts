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

export async function getPublicAvailability() {
  return prisma.availability.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
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
