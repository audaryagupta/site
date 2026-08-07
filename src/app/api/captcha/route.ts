import { NextResponse } from "next/server";
import { captchaClientConfig } from "@/lib/captcha";

// Never cache: the fallback issues a fresh signed challenge per request, and
// the active provider/site key is resolved from runtime env.
export const dynamic = "force-dynamic";

// Returns the active CAPTCHA config for the client to render the matching
// widget: reCAPTCHA/Turnstile site key, or a signed math challenge fallback.
export async function GET() {
  return NextResponse.json(captchaClientConfig());
}
