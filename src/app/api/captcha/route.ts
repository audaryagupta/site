import { NextResponse } from "next/server";
import { captchaClientConfig, issueFallbackChallenge } from "@/lib/captcha";

// Never cache: the fallback issues a fresh signed challenge per request, and
// the active provider/site key is resolved from runtime env.
export const dynamic = "force-dynamic";

// Returns the active CAPTCHA config for the client to render the matching
// widget: reCAPTCHA/Turnstile site key, or a signed math challenge fallback.
// `?fallback=1` always returns the signed math challenge — the client requests
// this when the reCAPTCHA/Turnstile widget fails to load so the form stays
// usable.
export async function GET(req: Request) {
  const fallback = new URL(req.url).searchParams.get("fallback") === "1";
  if (fallback) {
    return NextResponse.json({ mode: "fallback", ...issueFallbackChallenge() });
  }
  return NextResponse.json(captchaClientConfig());
}
