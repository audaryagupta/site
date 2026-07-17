import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().max(80).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName } = schema.parse(body);
    const normalized = email.toLowerCase().trim();

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      if (existing.status === "unsubscribed") {
        await prisma.subscriber.update({
          where: { email: normalized },
          data: { status: "active", firstName: firstName || existing.firstName },
        });
      }
      return NextResponse.json({
        message: "You're on the list — see you Friday.",
      });
    }

    await prisma.subscriber.create({
      data: { email: normalized, firstName },
    });

    return NextResponse.json({
      message: "You're in. The next Friday recap is headed your way.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
