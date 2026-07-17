import { prisma } from "./prisma";

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
