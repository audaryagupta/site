import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { hasOpenAI } from "@/lib/openai";
import { assistWriting, translateHtml, type AssistMode } from "@/lib/ai";

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  if (!hasOpenAI()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured yet." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "assist") {
      const result = await assistWriting(
        body.mode as AssistMode,
        body.content || "",
        body.instruction
      );
      return NextResponse.json({ result });
    }
    if (action === "translate") {
      const result = await translateHtml(
        body.content || "",
        body.targetLang || "hi"
      );
      return NextResponse.json({ result });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "AI request failed" },
      { status: 500 }
    );
  }
}
