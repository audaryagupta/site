import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { exportMonthLogs } from "@/lib/logExport";

// Manual export of the CURRENT month (IST) from the console.
export async function POST() {
  const g = await guard();
  if (g) return g;
  const nowIst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  try {
    const result = await exportMonthLogs(nowIst.getFullYear(), nowIst.getMonth());
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
