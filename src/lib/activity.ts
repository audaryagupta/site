import { prisma } from "./prisma";
import { getSession } from "./auth";

/**
 * Records a major action to the system log. Deliberately called only for
 * meaningful mutations (publishing, additions, sends, cancellations) — never
 * for UI navigation or button clicks. Best-effort: never throws to the caller.
 *
 * When `actor` is omitted it is auto-filled from the signed-in account so the
 * log always shows *who* did the action; background jobs record "system".
 */
export async function logActivity(
  action: string,
  detail = "",
  actor?: string
): Promise<void> {
  try {
    let who = actor;
    if (!who) {
      try {
        const session = await getSession();
        who = (session?.user?.email || "").toLowerCase().trim() || "system";
      } catch {
        who = "system";
      }
    }
    await prisma.activityLog.create({ data: { action, detail, actor: who } });
  } catch {
    // Logging must never break the underlying operation.
  }
}
