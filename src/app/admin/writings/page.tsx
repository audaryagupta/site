import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";

export const dynamic = "force-dynamic";

export default async function AdminWritingsPage() {
  const articles = await prisma.article.findMany({
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Writings</h1>
        <Link
          href="/admin/writings/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + New writing
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-muted">No writings yet. Create your first one.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Topics</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/writings/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.title || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        a.status === "published"
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted"
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {a.tags.map((t) => t.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{a.views}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(a.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteArticleButton id={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
