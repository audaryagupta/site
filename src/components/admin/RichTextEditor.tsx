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

// execCommand("fontSize") only accepts the legacy 1–7 keyword sizes, which all
// email clients render reliably. Expose a few friendly labels.
const FONT_SIZES: { label: string; value: string }[] = [
  { label: "Smallest", value: "1" },
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Largest", value: "6" },
];

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
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Remember the current selection while it's inside the editor so toolbar
  // controls that steal focus (e.g. the native size <select>) can restore it.
  function saveSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !ref.current) return;
    const range = sel.getRangeAt(0);
    if (ref.current.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (!sel || !savedRange.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    saveSelection();
  }

  function addLink() {
    const url = window.prompt("Link URL or email (https://… or name@domain.com)");
    if (!url) return;
    const v = url.trim();
    let href: string;
    if (/^(https?:|mailto:|tel:)/i.test(v)) {
      href = v;
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      href = `mailto:${v}`;
    } else {
      href = `https://${v}`;
    }
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
        <select
          title="Text size"
          aria-label="Text size"
          defaultValue=""
          className="ml-0.5 h-8 rounded-md border border-line bg-card px-1.5 text-xs text-muted outline-none hover:text-foreground focus:border-foreground"
          onMouseDown={saveSelection}
          onChange={(e) => {
            if (e.target.value) exec("fontSize", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
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
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="prose-editorial max-w-none px-4 py-3 text-sm leading-relaxed outline-none [&:empty::before]:text-muted [&:empty::before]:content-[attr(data-placeholder)]"
        style={{ minHeight }}
      />
    </div>
  );
}
