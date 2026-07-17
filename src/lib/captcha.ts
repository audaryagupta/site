import crypto from "crypto";

// CAPTCHA for public forms (appointments). Uses Cloudflare Turnstile when
// keys are configured; otherwise falls back to a lightweight, stateless
// server-signed math challenge so the form is always protected.

const FALLBACK_TTL_MS = 10 * 60 * 1000; // 10 minutes

function secret() {
  return process.env.NEXTAUTH_SECRET || "byaudarya-dev-captcha-secret";
}

export function turnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
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

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  try {
    const body = new URLSearchParams();
    body.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
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
  if (turnstileConfigured()) {
    return verifyTurnstile(token, ip);
  }
  return verifyFallback(token, answer || "");
}
