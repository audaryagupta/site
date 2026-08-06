import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, formatDateTime } from "@/lib/utils";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await emailConfigured()) || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ ok: true, skipped: "email not configured" });
  }

  const [pendingAppointments, unreadMessages, upcoming] = await Promise.all([
    prisma.appointment.findMany({ where: { status: "pending" } }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.appointment.findMany({
      where: {
        status: "accepted",
        requestedStart: {
          gte: new Date(),
          lte: new Date(Date.now() + 36 * 3600 * 1000),
        },
      },
      orderBy: { requestedStart: "asc" },
    }),
  ]);

  // Only email if there is something worth reporting.
  if (
    pendingAppointments.length === 0 &&
    unreadMessages === 0 &&
    upcoming.length === 0
  ) {
    return NextResponse.json({ ok: true, sent: false });
  }

  const pendingList = pendingAppointments
    .map(
      (a) =>
        `<li>${a.name} — ${a.mode} — ${formatDateTime(a.requestedStart)} IST</li>`
    )
    .join("");
  const upcomingList = upcoming
    .map(
      (a) =>
        `<li>${a.name} — ${a.mode} — ${formatDateTime(a.requestedStart)} IST</li>`
    )
    .join("");

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `Your byAudarya daily digest`,
    html: `<h2>Daily digest</h2>
    ${
      upcoming.length
        ? `<p><strong>Upcoming (next 36h):</strong></p><ul>${upcomingList}</ul>`
        : ""
    }
    ${
      pendingAppointments.length
        ? `<p><strong>${pendingAppointments.length} appointment request(s) awaiting you:</strong></p><ul>${pendingList}</ul>`
        : ""
    }
    ${unreadMessages ? `<p>${unreadMessages} unread contact message(s).</p>` : ""}
    <p><a href="${absoluteUrl("/admin")}">Open studio →</a></p>`,
  });

  return NextResponse.json({ ok: true, sent: true });
}
