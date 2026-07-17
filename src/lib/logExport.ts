import { prisma } from "./prisma";
import {
  ensureDriveFolder,
  googleConfigured,
  uploadTextFile,
} from "./google";

const TZ = "Asia/Kolkata";
const FOLDER = "byAudarya — Activity Logs";

function istStamp(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export interface ExportResult {
  uploaded: boolean;
  count: number;
  message?: string;
  fileId?: string;
}

/**
 * Exports one month of activity logs to a CSV in a Google Drive folder.
 * `year`/`monthIndex` are 0-based month; month boundaries are IST (+05:30).
 */
export async function exportMonthLogs(
  year: number,
  monthIndex: number
): Promise<ExportResult> {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const start = new Date(`${year}-${mm}-01T00:00:00+05:30`);
  const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const end = new Date(
    `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01T00:00:00+05:30`
  );

  const logs = await prisma.activityLog.findMany({
    where: { createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "asc" },
  });

  if (logs.length === 0) {
    return { uploaded: false, count: 0, message: "No activity for this month." };
  }

  const header = "timestamp_ist,action,detail,actor";
  const rows = logs.map((l) =>
    [
      istStamp(l.createdAt),
      csvCell(l.action),
      csvCell(l.detail),
      csvCell(l.actor),
    ].join(",")
  );
  const csv = [header, ...rows].join("\n") + "\n";

  if (!(await googleConfigured())) {
    return {
      uploaded: false,
      count: logs.length,
      message: "Google Drive not connected — connect it on the Calendar tab.",
    };
  }

  const folderId = await ensureDriveFolder(FOLDER);
  const fileId = await uploadTextFile(
    folderId,
    `activity-${year}-${mm}.csv`,
    csv
  );

  return { uploaded: true, count: logs.length, fileId };
}
