import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

// Uploaded files (article audio, link-hub icons…) live on the persistent
// volume next to the SQLite database so they survive redeploys. In prod
// DATABASE_URL is file:/data/prod.db, so uploads land in /data/uploads.
function baseDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const db = process.env.DATABASE_URL || "file:./dev.db";
  const file = db.replace(/^file:/, "");
  return path.join(path.dirname(path.resolve(file)), "uploads");
}

export const UPLOAD_BASE = baseDir();

const EXT_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

export function mimeForPath(p: string): string {
  return EXT_MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
}

function safeExt(name: string, fallback: string): string {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : fallback;
}

// Save a buffer under uploads/<sub>/ and return the public URL path.
export async function saveUpload(
  sub: string,
  originalName: string,
  buf: Buffer,
  fallbackExt = ""
): Promise<string> {
  const cleanSub = sub.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "misc";
  const dir = path.join(UPLOAD_BASE, cleanSub);
  await fs.mkdir(dir, { recursive: true });
  const ext = safeExt(originalName, fallbackExt);
  const filename = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);
  return `/api/uploads/${cleanSub}/${filename}`;
}

// Resolve a public /api/uploads/... path segment array to an absolute path,
// guarding against traversal.
export function resolveUpload(segments: string[]): string | null {
  const rel = segments.join("/");
  const abs = path.normalize(path.join(UPLOAD_BASE, rel));
  if (!abs.startsWith(path.normalize(UPLOAD_BASE))) return null;
  return abs;
}
