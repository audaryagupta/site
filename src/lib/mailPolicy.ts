import { prisma } from "./prisma";

// Global pause switch — when on, no outbound mailings are sent.
export async function emailsPaused(): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { key: "emails_paused" } });
  return s?.value === "true";
}

// True if an address is on the blacklist (blocked from all mailings and the list).
export async function isBlacklisted(email: string): Promise<boolean> {
  const e = (email || "").toLowerCase().trim();
  if (!e) return false;
  const hit = await prisma.emailBlacklist.findUnique({ where: { email: e } });
  return Boolean(hit);
}

// Removes any blacklisted addresses from a recipient list.
export async function filterBlacklisted<T extends { email: string }>(
  recipients: T[]
): Promise<T[]> {
  const blocked = new Set(
    (await prisma.emailBlacklist.findMany({ select: { email: true } })).map(
      (b) => b.email.toLowerCase().trim()
    )
  );
  return recipients.filter((r) => !blocked.has((r.email || "").toLowerCase().trim()));
}
