import { NextResponse } from "next/server";
import { issueFallbackChallenge, turnstileConfigured } from "@/lib/captcha";

// Returns a challenge for the fallback (no-Turnstile) CAPTCHA. When Turnstile
// is configured the client renders its widget instead and this returns nothing
// to solve.
export async function GET() {
  if (turnstileConfigured()) {
    return NextResponse.json({ mode: "turnstile" });
  }
  const challenge = issueFallbackChallenge();
  return NextResponse.json({ mode: "fallback", ...challenge });
}
