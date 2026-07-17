import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewsletterEditor } from "@/components/admin/NewsletterEditor";

export const dynamic = "force-dynamic";

export default async function NewsletterEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const nl = await prisma.newsletter.findUnique({ where: { id: params.id } });
  if (!nl) notFound();

  return (
    <NewsletterEditor
      initial={{
        id: nl.id,
        type: nl.type,
        subject: nl.subject,
        previewText: nl.previewText,
        contentHtml: nl.contentHtml,
        dataJson: nl.dataJson,
        status: nl.status,
        audience: nl.audience,
        recipientCount: nl.recipientCount,
      }}
    />
  );
}
