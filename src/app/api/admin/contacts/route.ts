import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ contacts });
}

/**
 * Bulk upload. Accepts { rows: [{email, firstName, lastName, birthday, notes}] }
 * or { csv: "email,firstName,lastName,birthday\n..." }.
 */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = await req.json();

  let rows: {
    email: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
    anniversary?: string;
    notes?: string;
  }[] = [];

  if (Array.isArray(body.rows)) {
    rows = body.rows;
  } else if (typeof body.csv === "string") {
    const lines = body.csv.split(/\r?\n/).filter(Boolean);
    const header = lines[0]
      .toLowerCase()
      .split(",")
      .map((s: string) => s.trim());
    const emailIdx = header.indexOf("email");
    const fnIdx = header.indexOf("firstname");
    const lnIdx = header.indexOf("lastname");
    const bdIdx = header.indexOf("birthday");
    const anIdx = header.indexOf("anniversary");
    const dataLines: string[] = lines.slice(emailIdx >= 0 ? 1 : 0);
    for (const line of dataLines) {
      const cols = line.split(",").map((s: string) => s.trim());
      const email = emailIdx >= 0 ? cols[emailIdx] : cols[0];
      if (!email || !email.includes("@")) continue;
      rows.push({
        email,
        firstName: fnIdx >= 0 ? cols[fnIdx] : cols[1],
        lastName: lnIdx >= 0 ? cols[lnIdx] : cols[2],
        birthday: bdIdx >= 0 ? cols[bdIdx] : undefined,
        anniversary: anIdx >= 0 ? cols[anIdx] : undefined,
      });
    }
  }

  const parseDate = (v?: string): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  let added = 0;
  for (const r of rows) {
    const email = (r.email || "").toLowerCase().trim();
    if (!email.includes("@")) continue;
    const birthday = parseDate(r.birthday);
    const anniversary = parseDate(r.anniversary);
    try {
      await prisma.contact.upsert({
        where: { email },
        update: {
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          birthday,
          anniversary,
          notes: r.notes || "",
        },
        create: {
          email,
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          birthday,
          anniversary,
          notes: r.notes || "",
        },
      });
      added += 1;
    } catch {
      // skip bad row
    }
  }

  if (added)
    await logActivity(
      "contact.added",
      added === 1 ? "1 contact added/updated" : `${added} contacts added/updated`
    );
  return NextResponse.json({ ok: true, added });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await req.json();
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
