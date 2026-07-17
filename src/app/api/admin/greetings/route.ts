import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/adminApi";

export async function GET() {
  const g = await guard();
  if (g) return g;
  const greetings = await prisma.greetingRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ greetings });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "sent", "dismissed"]),
});

export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id, status } = patchSchema.parse(await req.json());
  const greeting = await prisma.greetingRequest.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ greeting });
}
