import { Fragment } from "react";

const EMAIL_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

// Renders long-form legal/policy copy stored as a single editable string:
// blank lines separate paragraphs, and any email address is turned into a
// mailto link so the text stays fully editable from Studio → Site text.
function linkify(text: string) {
  // String.split with a single capture group yields alternating
  // [text, match, text, match, …], so odd indices are the captured emails.
  const parts = text.split(EMAIL_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${part}`}>
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

export function LegalBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="prose-editorial mt-8">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {linkify(p)}
        </p>
      ))}
    </div>
  );
}
