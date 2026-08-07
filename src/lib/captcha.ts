import crypto from "crypto";

// CAPTCHA for public forms (appointments, contact). Prefers Google reCAPTCHA v2
// when keys are configured, then Cloudflare Turnstile, otherwise falls back to
// a lightweight, stateless server-signed math challenge so the form is always
// protected. The active provider + site key are resolved on the server and
// returned to the client (via /api/captcha) so the widget the visitor sees
// always matches what the server will verify — and keys can be plain runtime
// secrets (no NEXT_PUBLIC / rebuild needed).

const FALLBACK_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CaptchaProvider = "recaptcha" | "turnstile" | "fallback";

function secret() {
  return process.env.NEXTAUTH_SECRET || "byaudarya-dev-captcha-secret";
}

function recaptchaSiteKey() {
  return process.env.RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}
function recaptchaConfigured(): boolean {
  return Boolean(recaptchaSiteKey() && process.env.RECAPTCHA_SECRET_KEY);
}

function turnstileSiteKey() {
  return (
    process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
}
export function turnstileConfigured(): boolean {
  return Boolean(turnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY);
}

// Which provider is active, resolved from configured keys.
export function captchaProvider(): CaptchaProvider {
  if (recaptchaConfigured()) return "recaptcha";
  if (turnstileConfigured()) return "turnstile";
  return "fallback";
}

// Public config the client needs to render the correct widget.
export function captchaClientConfig():
  | { mode: "recaptcha" | "turnstile"; sitekey: string }
  | { mode: "fallback"; question: string; token: string } {
  const provider = captchaProvider();
  if (provider === "recaptcha") {
    return { mode: "recaptcha", sitekey: recaptchaSiteKey()! };
  }
  if (provider === "turnstile") {
    return { mode: "turnstile", sitekey: turnstileSiteKey()! };
  }
  return { mode: "fallback", ...issueFallbackChallenge() };
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

// Issues a math challenge: returns the question and a signed token that
// encodes the correct answer + expiry (no server-side storage needed).
export function issueFallbackChallenge(): { question: string; token: string } {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const answer = a + b;
  const exp = Date.now() + FALLBACK_TTL_MS;
  const payload = `${answer}.${exp}`;
  const token = `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
  return { question: `What is ${a} + ${b}?`, token };
}

function verifyFallback(token: string, answer: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64, mac] = parts;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return false;
  }
  if (sign(payload) !== mac) return false;
  const [expected, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return false;
  return String(Number(answer)) === expected;
}

async function verifyRemote(
  url: string,
  secretKey: string,
  token: string,
  ip?: string
): Promise<boolean> {
  try {
    const body = new URLSearchParams();
    body.append("secret", secretKey);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);
    const res = await fetch(url, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// Verifies a submitted CAPTCHA. `answer` is only used by the fallback path.
export async function verifyCaptcha(
  token: string | undefined,
  answer: string | undefined,
  ip?: string
): Promise<boolean> {
  if (!token) return false;
  const provider = captchaProvider();
  if (provider === "recaptcha") {
    return verifyRemote(
      "https://www.google.com/recaptcha/api/siteverify",
      process.env.RECAPTCHA_SECRET_KEY!,
      token,
      ip
    );
  }
  if (provider === "turnstile") {
    return verifyRemote(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      process.env.TURNSTILE_SECRET_KEY!,
      token,
      ip
    );
  }
  return verifyFallback(token, answer || "");
}
