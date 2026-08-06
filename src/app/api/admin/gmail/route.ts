import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { getGmailAccount, disconnectGmail, type MailRole } from "@/lib/google";

// Connection status for both outgoing mailboxes.
export async function GET() {
  const g = await guard();
  if (g) return g;
  const [mass, personal] = await Promise.all([
    getGmailAccount("mass"),
    getGmailAccount("personal"),
  ]);
  return NextResponse.json({
    mass: { connected: Boolean(mass), email: mass?.email || "" },
    personal: { connected: Boolean(personal), email: personal?.email || "" },
  });
}

// Disconnect a mailbox (?role=mass|personal).
export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const role: MailRole =
    new URL(req.url).searchParams.get("role") === "personal" ? "personal" : "mass";
  await disconnectGmail(role);
  return NextResponse.json({ ok: true });
}
