import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolveUpload, mimeForPath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const abs = resolveUpload(params.path || []);
  if (!abs) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await fs.readFile(abs);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mimeForPath(abs),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
