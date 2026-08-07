"use client";

import { useSyncExternalStore } from "react";
import type { ContentValue } from "@/lib/siteContentTypes";

// A tiny module-level store shared by the floating editor bar and every inline
// Editable* component. It keeps the current (possibly unsaved) value for each
// region id, tracks which ids are dirty, and drives edit-mode UI. Because it is
// a singleton it survives client-side navigations between pages.

type Snapshot = {
  canEdit: boolean;
  editMode: boolean;
  activeId: string | null;
  version: number;
};

let snap: Snapshot = { canEdit: false, editMode: false, activeId: null, version: 0 };
const values = new Map<string, ContentValue>();
const dirty = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  snap = { ...snap, version: snap.version + 1 };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useEditorSnapshot(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snap,
    () => snap
  );
}

export function setCanEdit(v: boolean) {
  if (snap.canEdit !== v) {
    snap = { ...snap, canEdit: v };
    emit();
  }
}

export function setEditMode(v: boolean) {
  snap = { ...snap, editMode: v, activeId: v ? snap.activeId : null };
  if (typeof document !== "undefined") {
    document.body.classList.toggle("site-editing", v);
  }
  emit();
}

export function setActiveId(id: string | null) {
  snap = { ...snap, activeId: id };
  emit();
}

// Seed the store with a region's initial (saved-or-default) value the first
// time it renders, without clobbering an already-edited value.
export function seedValue(id: string, initial: ContentValue) {
  if (!values.has(id)) values.set(id, initial);
}

export function getValue<T extends ContentValue>(id: string, fallback: T): T {
  return (values.get(id) as T) ?? fallback;
}

export function updateValue(id: string, patch: Partial<ContentValue>) {
  const current = values.get(id) || {};
  values.set(id, { ...current, ...patch } as ContentValue);
  dirty.add(id);
  emit();
}

export function dirtyCount() {
  return dirty.size;
}

export function collectDirty(): { id: string; value: ContentValue }[] {
  return Array.from(dirty).map((id) => ({ id, value: values.get(id) as ContentValue }));
}

export function clearDirty() {
  dirty.clear();
  emit();
}
