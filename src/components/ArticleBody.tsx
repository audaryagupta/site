"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { cx } from "@/lib/utils";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  fr: "French",
  es: "Spanish",
  sa: "Sanskrit",
};

export function ArticleBody({
  primaryHtml,
  primaryLang,
  translationHtml,
  translationLang,
}: {
  primaryHtml: string;
  primaryLang: string;
  translationHtml?: string | null;
  translationLang?: string | null;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const hasTranslation = Boolean(translationHtml && translationLang);

  const primaryName = LANG_NAMES[primaryLang] || primaryLang.toUpperCase();
  const transName = translationLang
    ? LANG_NAMES[translationLang] || translationLang.toUpperCase()
    : "";

  return (
    <>
      {hasTranslation && (
        <div className="mb-8 inline-flex items-center gap-1 rounded-full border border-line p-1 text-sm">
          <Languages size={15} className="ml-2 text-muted" />
          <button
            onClick={() => setShowTranslation(false)}
            className={cx(
              "rounded-full px-3 py-1 transition",
              !showTranslation ? "bg-foreground text-background" : "text-muted"
            )}
          >
            {primaryName}
          </button>
          <button
            onClick={() => setShowTranslation(true)}
            className={cx(
              "rounded-full px-3 py-1 transition",
              showTranslation ? "bg-foreground text-background" : "text-muted"
            )}
          >
            {transName}
          </button>
        </div>
      )}

      <div
        className="prose-editorial"
        dangerouslySetInnerHTML={{
          __html:
            showTranslation && translationHtml ? translationHtml : primaryHtml,
        }}
      />
    </>
  );
}
