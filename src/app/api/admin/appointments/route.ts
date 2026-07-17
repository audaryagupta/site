import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const appointments = await prisma.appointment.findMany({
    orderBy: { requestedStart: "asc" },
  });
  return NextResponse.json({ appointments });
}
