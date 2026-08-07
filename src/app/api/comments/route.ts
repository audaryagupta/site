import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";

const postSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
});

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const comments = await prisma.comment.findMany({
    where: { articleSlug: slug, hidden: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      authorName: true,
      authorImage: true,
      body: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const session = await getSession();
  const user = session?.user;
  const email = user?.email?.trim();
  if (!user || !email) {
    return NextResponse.json(
      { error: "Please sign in to comment." },
      { status: 401 }
    );
  }

  let data;
  try {
    data = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please write a comment first." },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({
    where: { slug: data.slug },
    select: { status: true },
  });
  if (!article || article.status !== "published") {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      articleSlug: data.slug,
      authorName: user.name || email.split("@")[0],
      authorEmail: email,
      authorImage: user.image || "",
      body: data.body,
    },
    select: {
      id: true,
      authorName: true,
      authorImage: true,
      body: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ comment });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.comment.update({ where: { id }, data: { hidden: true } });
  return NextResponse.json({ ok: true });
}
