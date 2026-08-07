import { NextResponse } from "next/server";
import { guard } from "@/lib/adminApi";
import { gmailConsentUrl, type MailRole } from "@/lib/google";

// Kicks off Google authorization for one outgoing mailbox (admin only).
//   ?role=mass     → no-reply / bulk sender (mail@byaudarya.com)
//   ?role=personal → personal sender (audarya@byaudarya.com)
// Google returns to the shared /api/admin/google/callback with a matching state.
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;
  const role: MailRole =
    new URL(req.url).searchParams.get("role") === "personal" ? "personal" : "mass";
  return NextResponse.redirect(gmailConsentUrl(role));
}
