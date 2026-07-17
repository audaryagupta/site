import sanitizeHtmlLib from "sanitize-html";

const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "figure",
    "figcaption",
    "hr",
    "code",
    "pre",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

/** Sanitize rich HTML authored in the editor before storing/rendering. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtmlLib(dirty, OPTIONS);
}
