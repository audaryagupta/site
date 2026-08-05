import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 60 * 1024 * 1024; // 60 MB (audio narrations can be long)

const KIND_EXT: Record<string, string[]> = {
  audio: [".mp3", ".m4a", ".aac", ".ogg", ".oga", ".wav", ".webm"],
  icon: [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico"],
  image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"],
};

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") || "audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 60 MB)" }, { status: 400 });
  }
  const allowed = KIND_EXT[kind] || KIND_EXT.audio;
  const name = file.name.toLowerCase();
  if (!allowed.some((e) => name.endsWith(e))) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${allowed.join(", ")}` },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload(kind, file.name, buf, allowed[0]);
  return NextResponse.json({ ok: true, url });
}
