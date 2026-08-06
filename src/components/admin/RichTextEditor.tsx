"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Eraser,
} from "lucide-react";
import { cx } from "@/lib/utils";

// A lightweight contentEditable rich-text editor (bold / italic / underline /
// link / bullets) that emits HTML. Used by the email composer and the signature
// builder. The DOM is the source of truth while typing so the caret never
// jumps; `value` is only written into the DOM when it differs from what's shown
// (e.g. an external reset or first mount).
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    exec("createLink", href);
  }

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground";

  return (
    <div className={cx("rounded-md border border-line bg-card", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
        <button type="button" title="Bold" className={btn} onClick={() => exec("bold")}>
          <Bold size={15} />
        </button>
        <button type="button" title="Italic" className={btn} onClick={() => exec("italic")}>
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="Underline"
          className={btn}
          onClick={() => exec("underline")}
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          title="Bullet list"
          className={btn}
          onClick={() => exec("insertUnorderedList")}
        >
          <List size={15} />
        </button>
        <button type="button" title="Add link" className={btn} onClick={addLink}>
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          className={btn}
          onClick={() => exec("removeFormat")}
        >
          <Eraser size={15} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose-editorial max-w-none px-4 py-3 text-sm leading-relaxed outline-none [&:empty::before]:text-muted [&:empty::before]:content-[attr(data-placeholder)]"
        style={{ minHeight }}
      />
    </div>
  );
}
