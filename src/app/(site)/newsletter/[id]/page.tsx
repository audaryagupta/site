import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export default async function NewsletterIssuePage({
  params,
}: {
  params: { id: string };
}) {
  const issue = await prisma.newsletter.findUnique({
    where: { id: params.id },
  });
  if (!issue || issue.status !== "sent") notFound();

  return (
    <Container className="max-w-3xl py-16">
      <p className="text-xs uppercase tracking-widest text-muted">
        The Weekly Recap · {formatDate(issue.sentAt)}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {issue.subject}
      </h1>
      <div
        className="prose-editorial mt-10"
        dangerouslySetInnerHTML={{ __html: issue.contentHtml }}
      />
    </Container>
  );
}
