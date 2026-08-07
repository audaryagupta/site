"use client";

import { createElement, useRef } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cx } from "@/lib/utils";
import type { TextValue } from "@/lib/siteContentTypes";
import {
  getValue,
  seedValue,
  setActiveId,
  updateValue,
  useEditorSnapshot,
} from "./editorStore";
import { EditPopover } from "./EditPopover";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

const MIN = 0.6;
const MAX = 2.2;
const STEP = 0.08;

export function EditableText({
  id,
  as = "p",
  text,
  scale = 1,
  className,
  multiline = false,
}: {
  id: string;
  as?: Tag;
  text: string;
  scale?: number;
  className?: string;
  multiline?: boolean;
}) {
  seedValue(id, { text, scale });
  const snap = useEditorSnapshot();
  const value = getValue<TextValue>(id, { text, scale });
  const anchorRef = useRef<HTMLElement>(null);

  const fontStyle =
    value.scale !== 1 ? ({ fontSize: `${value.scale}em` } as const) : undefined;

  // Reader / non-edit view: render exactly as before, only scaling text when
  // the owner has nudged the size (so responsive classes stay intact at 1x).
  const inner = multiline
    ? value.text.split("\n\n").map((para, i) => (
        <p key={i} className={i > 0 ? "mt-5" : undefined}>
          <span style={fontStyle}>{para}</span>
        </p>
      ))
    : fontStyle
    ? <span style={fontStyle}>{value.text}</span>
    : value.text;

  if (!snap.canEdit) {
    return createElement(as, { className }, inner);
  }

  const active = snap.activeId === id;

  const node = createElement(
    as,
    {
      ref: anchorRef,
      className: cx(className, "site-edit-target", snap.editMode && "cursor-text"),
      onClick: (e: React.MouseEvent) => {
        if (!snap.editMode) return;
        e.preventDefault();
        e.stopPropagation();
        setActiveId(active ? null : id);
      },
      title: snap.editMode ? "Click to edit" : undefined,
    },
    inner
  );

  return (
    <>
      {node}
      {snap.editMode && active && (
        <EditPopover anchor={anchorRef.current} onClose={() => setActiveId(null)}>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
            Text
          </label>
          {multiline ? (
            <textarea
              autoFocus
              value={value.text}
              onChange={(e) => updateValue(id, { text: e.target.value })}
              rows={8}
              className="w-full resize-y rounded-md border border-line bg-background p-2 text-sm"
            />
          ) : (
            <textarea
              autoFocus
              value={value.text}
              onChange={(e) => updateValue(id, { text: e.target.value })}
              rows={2}
              className="w-full resize-y rounded-md border border-line bg-background p-2 text-sm"
            />
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted">
              Size {Math.round(value.scale * 100)}%
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Smaller"
                onClick={() =>
                  updateValue(id, {
                    scale: Math.max(MIN, Math.round((value.scale - STEP) * 100) / 100),
                  })
                }
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                aria-label="Reset size"
                onClick={() => updateValue(id, { scale: 1 })}
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                aria-label="Bigger"
                onClick={() =>
                  updateValue(id, {
                    scale: Math.min(MAX, Math.round((value.scale + STEP) * 100) / 100),
                  })
                }
                className="rounded-md border border-line p-1.5 hover:bg-subtle"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </EditPopover>
      )}
    </>
  );
}
