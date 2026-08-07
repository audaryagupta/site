"use client";

import { useRef } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import type { ButtonValue } from "@/lib/siteContentTypes";
import {
  getValue,
  seedValue,
  setActiveId,
  updateValue,
  useEditorSnapshot,
} from "./editorStore";
import { EditPopover } from "./EditPopover";

// An editable link/button. In reader mode it is a normal Next.js <Link>; in
// edit mode the label and destination can be changed inline.
export function EditableButton({
  id,
  label,
  href,
  className,
  children,
}: {
  id: string;
  label: string;
  href: string;
  className?: string;
  // Optional trailing content (e.g. an arrow icon) kept after the label.
  children?: React.ReactNode;
}) {
  seedValue(id, { label, href });
  const snap = useEditorSnapshot();
  const value = getValue<ButtonValue>(id, { label, href });
  const anchorRef = useRef<HTMLAnchorElement>(null);

  if (!snap.canEdit) {
    return (
      <Link href={value.href || "#"} className={className}>
        {value.label}
        {children}
      </Link>
    );
  }

  const active = snap.activeId === id;

  return (
    <>
      <a
        ref={anchorRef}
        href={value.href || "#"}
        className={cx(className, "site-edit-target")}
        onClick={(e) => {
          e.preventDefault();
          if (!snap.editMode) return;
          e.stopPropagation();
          setActiveId(active ? null : id);
        }}
        title={snap.editMode ? "Click to edit button" : undefined}
      >
        {value.label}
        {children}
      </a>
      {snap.editMode && active && (
        <EditPopover anchor={anchorRef.current} onClose={() => setActiveId(null)}>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
            Button label
          </label>
          <input
            autoFocus
            value={value.label}
            onChange={(e) => updateValue(id, { label: e.target.value })}
            className="mb-3 w-full rounded-md border border-line bg-background p-2 text-sm"
          />
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
            Link (URL or /path)
          </label>
          <input
            value={value.href}
            onChange={(e) => updateValue(id, { href: e.target.value })}
            className="w-full rounded-md border border-line bg-background p-2 text-sm"
          />
        </EditPopover>
      )}
    </>
  );
}
