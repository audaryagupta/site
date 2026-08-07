import { NextResponse } from "next/server";
import { requireAdmin, requireOwner, getSession } from "./auth";

export async function guard(): Promise<NextResponse | null> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Owner-only guard for team management and other sensitive actions.
export async function guardOwner(): Promise<NextResponse | null> {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }
  return null;
}

// The signed-in account's email, for attributing logged actions.
export async function actor(): Promise<string> {
  const session = await getSession();
  return (session?.user?.email || "").toLowerCase().trim() || "system";
}
