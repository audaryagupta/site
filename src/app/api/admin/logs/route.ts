import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") || 200), 1000);
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ logs });
}
