import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ quotes });
}

const truthy = (v: unknown) =>
  ["1", "true", "yes", "y", "mine"].includes(String(v).toLowerCase().trim());

/**
 * Add quotes. Accepts { rows: [{text, author, mine}] } or
 * { csv: "text,author,mine\n..." }. CSV cells may be quoted to allow commas.
 */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = await req.json();

  let rows: { text: string; author?: string; mine?: unknown }[] = [];

  if (Array.isArray(body.rows)) {
    rows = body.rows;
  } else if (typeof body.csv === "string") {
    const lines = body.csv.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length) {
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes("text");
      const textIdx = hasHeader
        ? header.split(",").map((s: string) => s.trim()).indexOf("text")
        : 0;
      const authorIdx = hasHeader
        ? header.split(",").map((s: string) => s.trim()).indexOf("author")
        : 1;
      const mineIdx = hasHeader
        ? header.split(",").map((s: string) => s.trim()).indexOf("mine")
        : 2;
      for (const line of hasHeader ? lines.slice(1) : lines) {
        const cols = parseCsvLine(line);
        const text = (cols[textIdx] || "").trim();
        if (!text) continue;
        rows.push({
          text,
          author: authorIdx >= 0 ? cols[authorIdx] : "",
          mine: mineIdx >= 0 ? cols[mineIdx] : "",
        });
      }
    }
  }

  let added = 0;
  for (const r of rows) {
    const text = (r.text || "").trim();
    if (!text) continue;
    await prisma.quote.create({
      data: {
        text,
        author: (r.author || "").trim(),
        mine: typeof r.mine === "boolean" ? r.mine : truthy(r.mine),
      },
    });
    added += 1;
  }

  if (added) await logActivity("quote.added", `${added} quote(s) added`);
  return NextResponse.json({ ok: true, added });
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id, active } = await req.json();
  const quote = await prisma.quote.update({
    where: { id },
    data: { active: Boolean(active) },
  });
  return NextResponse.json({ quote });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = await req.json();
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Minimal CSV line parser that respects double-quoted fields.
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else cur += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
