import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", req.url));
  }
  const sub = await prisma.subscriber.findUnique({ where: { unsubToken: token } });
  if (!sub) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", req.url));
  }
  await prisma.subscriber.update({
    where: { unsubToken: token },
    data: { status: "unsubscribed" },
  });
  return NextResponse.redirect(new URL("/unsubscribe?status=ok", req.url));
}
