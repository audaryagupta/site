import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const toSlug = (name: string) => slugify(name, { lower: true, strict: true });

const settings: Record<string, string> = {
  about_title: "About Audarya",
  about_role: "Writer · Finance, tech, business & the world",
  about_bio:
    "I'm Audarya Gupta. I write about finance, technology, business and geopolitics — and, now and then, about ordinary life. This is my corner of the internet: unhurried, personal, and honest. Thanks for reading.",
  about_image: "",
  home_hero_image: "",
  home_intro:
    "Ideas on finance, tech, business and the world — written slowly, meant to last.",
  contact_intro:
    "Whether it's an idea, a collaboration, or just a hello — I'd love to hear from you.",
  now_intro:
    "A running note on what I'm reading, watching and thinking about right now.",
};

const topics = [
  "Finance & Economics",
  "Business & Startups",
  "Technology",
  "Politics & Policy",
  "Personal Essays",
  "Book Reviews",
  "Travel & Food",
];

async function main() {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {}, // don't overwrite edits on re-seed
      create: { key, value },
    });
  }

  for (const name of topics) {
    const slug = toSlug(name);
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }

  // A welcome article so the site isn't empty on first run.
  const existing = await prisma.article.findUnique({
    where: { slug: "welcome" },
  });
  if (!existing) {
    await prisma.article.create({
      data: {
        slug: "welcome",
        title: "Welcome to the new byAudarya",
        excerpt:
          "A fresh home for my writing on finance, tech, business and the world.",
        contentHtml:
          "<p>This is the new home for my writing. Expect essays on finance, technology, business and the world — plus the occasional personal note.</p><h2>What to expect</h2><p>Slow, considered pieces. A weekly Friday recap of the news that mattered. And a place to say hello.</p>",
        language: "en",
        status: "published",
        featured: true,
        readingMinutes: 1,
        publishedAt: new Date(),
        tags: {
          connectOrCreate: [
            {
              where: { slug: "personal-essays" },
              create: { name: "Personal Essays", slug: "personal-essays" },
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
