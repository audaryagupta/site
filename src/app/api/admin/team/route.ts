import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard, guardOwner, actor } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";
import { emailConfigured, sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";

const OWNER_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";
const STUDIO_HOST = process.env.NEXT_PUBLIC_STUDIO_HOST || "";
const loginUrl = STUDIO_HOST ? `https://${STUDIO_HOST}/admin` : `${SITE}/admin`;

// Any admin may view the team list; only the owner can change it.
export async function GET() {
  const g = await guard();
  if (g) return g;
  const members = await prisma.teamMember.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ owner: OWNER_EMAIL, members });
}

export async function POST(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const { email, name } = (await req.json()) as {
    email?: string;
    name?: string;
  };
  const e = (email || "").toLowerCase().trim();
  if (!e || !e.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (e === OWNER_EMAIL) {
    return NextResponse.json(
      { error: "That address is the owner." },
      { status: 400 }
    );
  }

  const invitedBy = await actor();
  const member = await prisma.teamMember.upsert({
    where: { email: e },
    update: { status: "active", name: name || undefined, invitedBy },
    create: {
      email: e,
      name: name || "",
      role: "member",
      status: "active",
      invitedBy,
    },
  });

  await logActivity("team.invited", e);

  let emailed = false;
  if (emailConfigured()) {
    try {
      await sendEmail({
        to: e,
        subject: "You've been given access to the byAudarya Studio",
        html: `<p>Hi${name ? " " + escapeHtml(name) : ""},</p>
          <p>You've been invited to the byAudarya Studio dashboard. Sign in with this Google account:</p>
          <p><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
          <p>Use “Continue with Google” and sign in as <strong>${escapeHtml(
            e
          )}</strong>.</p>`,
        text: `You've been invited to the byAudarya Studio. Sign in at ${loginUrl} with ${e}.`,
      });
      emailed = true;
    } catch {
      // invite still valid even if the email fails
    }
  }

  return NextResponse.json({ ok: true, member, emailed });
}

// Revoke (status=revoked) or reactivate a member. Owner only.
export async function PATCH(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const { id, status } = (await req.json()) as { id?: string; status?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const next = status === "active" ? "active" : "revoked";
  const member = await prisma.teamMember.update({
    where: { id },
    data: { status: next },
  });
  await logActivity(
    next === "revoked" ? "team.revoked" : "team.reactivated",
    member.email
  );
  return NextResponse.json({ ok: true, member });
}

export async function DELETE(req: Request) {
  const g = await guardOwner();
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const member = await prisma.teamMember.delete({ where: { id } });
  await logActivity("team.removed", member.email);
  return NextResponse.json({ ok: true });
}
