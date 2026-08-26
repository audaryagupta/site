// Link hub targets: an entry can be a website, a phone number, a WhatsApp
// number or an email address. The dashboard lets you type a bare number /
// address and this turns it into a proper href (tel: / wa.me / mailto:) so
// visitors get tap-to-call and tap-to-mail instead of a broken https:// link.

export type LinkTargetType = "website" | "phone" | "whatsapp" | "email";

export const LINK_TARGET_TYPES: {
  value: LinkTargetType;
  label: string;
  placeholder: string;
  icon: string;
}[] = [
  {
    value: "website",
    label: "Website / link",
    placeholder: "https://example.com",
    icon: "link",
  },
  {
    value: "phone",
    label: "Phone number",
    placeholder: "+91 98765 43210",
    icon: "phone",
  },
  {
    value: "whatsapp",
    label: "WhatsApp number",
    placeholder: "+91 98765 43210",
    icon: "whatsapp",
  },
  {
    value: "email",
    label: "Email address",
    placeholder: "you@example.com",
    icon: "mail",
  },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Digits (keeping a leading +) from a human-typed phone number. */
export function phoneDigits(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

/** True when the text is plausibly a phone number rather than a URL. */
export function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  // Only digits and the usual separators, and enough digits to be a number.
  if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

/** True when the text is plausibly an email address. */
export function looksLikeEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Build the href for an explicit target type chosen in the dashboard. */
export function buildLinkUrl(type: LinkTargetType, value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  switch (type) {
    case "phone":
      return `tel:${phoneDigits(raw)}`;
    case "whatsapp":
      // wa.me expects the full international number, digits only.
      return `https://wa.me/${phoneDigits(raw).replace(/^\+/, "")}`;
    case "email":
      return `mailto:${raw}`;
    default:
      return /^(https?:|mailto:|tel:)/i.test(raw) ? raw : `https://${raw}`;
  }
}

/**
 * Normalize whatever ended up in the url field (dashboard add form, inline
 * edit, or an older row) into a usable href — without turning a phone number
 * or email address into a broken "https://" link.
 */
export function normalizeLinkUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|wa\.me\/)/i.test(value)) {
    return value.startsWith("wa.me/") ? `https://${value}` : value;
  }
  if (looksLikePhone(value)) return `tel:${phoneDigits(value)}`;
  if (looksLikeEmail(value)) return `mailto:${value}`;
  return `https://${value}`;
}

/** Human-friendly rendering of a stored href, for the dashboard list. */
export function displayLinkUrl(url: string): string {
  if (/^tel:/i.test(url)) return url.replace(/^tel:/i, "");
  if (/^mailto:/i.test(url)) return url.replace(/^mailto:/i, "");
  return url;
}
