import { NextResponse } from "next/server";
import { requireAdmin } from "./auth";

export async function guard(): Promise<NextResponse | null> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
