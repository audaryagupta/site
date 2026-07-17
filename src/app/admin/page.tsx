import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    published,
    drafts,
    subscribers,
    pendingAppointments,
    unreadMessages,
    pendingNewsletters,
    totalViews,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "draft" } }),
    prisma.subscriber.count({ where: { status: "active" } }),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.newsletter.count({ where: { status: "pending_approval" } }),
    prisma.article.aggregate({ _sum: { views: true } }),
  ]);
  return {
    published,
    drafts,
    subscribers,
    pendingAppointments,
    unreadMessages,
    pendingNewsletters,
    totalViews: totalViews._sum.views || 0,
  };
}

export default async function AdminHome() {
  const stats = await getStats();
  const recentAppointments = await prisma.appointment.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const cards = [
    { label: "Published", value: stats.published, href: "/admin/writings" },
    { label: "Drafts", value: stats.drafts, href: "/admin/writings" },
    { label: "Subscribers", value: stats.subscribers, href: "/admin/subscribers" },
    { label: "Total views", value: stats.totalViews, href: "/admin/writings" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Studio</h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back, Audarya. Here&apos;s the state of things.
          </p>
        </div>
        <Link
          href="/admin/writings/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + New writing
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-line bg-card p-5 transition hover:shadow-sm"
          >
            <p className="text-xs uppercase tracking-widest text-muted">
              {c.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>

      {(stats.pendingNewsletters > 0 ||
        stats.pendingAppointments > 0 ||
        stats.unreadMessages > 0) && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Needs your attention
          </h2>
          <ul className="space-y-2">
            {stats.pendingNewsletters > 0 && (
              <li>
                <Link
                  href="/admin/newsletters"
                  className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm hover:bg-subtle"
                >
                  <span>
                    {stats.pendingNewsletters} newsletter(s) awaiting your
                    approval
                  </span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            )}
            {stats.pendingAppointments > 0 && (
              <li>
                <Link
                  href="/admin/appointments"
                  className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm hover:bg-subtle"
                >
                  <span>
                    {stats.pendingAppointments} appointment request(s) to review
                  </span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            )}
            {stats.unreadMessages > 0 && (
              <li>
                <Link
                  href="/admin/contacts"
                  className="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm hover:bg-subtle"
                >
                  <span>{stats.unreadMessages} unread contact message(s)</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {recentAppointments.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Latest appointment requests
          </h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-card">
            {recentAppointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-muted">
                    {a.mode} · {formatDate(a.requestedStart)}
                  </p>
                </div>
                <Link
                  href="/admin/appointments"
                  className="text-muted hover:text-foreground"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
