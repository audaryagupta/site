import { prisma } from "./prisma";

/**
 * Records a major action to the system log. Deliberately called only for
 * meaningful mutations (publishing, additions, sends, cancellations) — never
 * for UI navigation or button clicks. Best-effort: never throws to the caller.
 */
export async function logActivity(
  action: string,
  detail = "",
  actor = ""
): Promise<void> {
  try {
    await prisma.activityLog.create({ data: { action, detail, actor } });
  } catch {
    // Logging must never break the underlying operation.
  }
}
