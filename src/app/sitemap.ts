import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  const staticPaths = ["", "/about", "/contact", "/writings", "/newsletter"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const articles = await prisma.article.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true, publishedAt: true },
    });
    for (const a of articles) {
      entries.push({
        url: `${base}/writings/${a.slug}`,
        lastModified: a.updatedAt || a.publishedAt || undefined,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {
    // DB not reachable at build/generation time — return static entries only.
  }

  return entries;
}
