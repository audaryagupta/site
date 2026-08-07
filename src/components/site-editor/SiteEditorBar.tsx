"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";
import {
  clearDirty,
  collectDirty,
  dirtyCount,
  setCanEdit,
  setEditMode,
  useEditorSnapshot,
} from "./editorStore";

// Floating control shown only to signed-in admins. Toggles the in-page edit
// mode and saves all pending changes. Reader visitors never see it because the
// permission probe (GET /api/admin/site-content) returns 401 for them.
export function SiteEditorBar() {
  const snap = useEditorSnapshot();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/site-content")
      .then((r) => {
        if (alive && r.ok) setCanEdit(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!snap.canEdit) return null;

  const pending = dirtyCount();

  async function save() {
    const edits = collectDirty();
    if (edits.length === 0) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });
      if (!res.ok) throw new Error();
      clearDirty();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setEditMode(false);
      router.refresh();
    } catch {
      alert("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[300] -translate-x-1/2 print:hidden">
      {snap.editMode ? (
        <div className="flex items-center gap-2 rounded-full border border-line bg-card/95 px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur">
          <span className="px-1 text-xs text-muted">
            Editing · click text, buttons or photos
            {pending > 0 ? ` · ${pending} unsaved` : ""}
          </span>
          <button
            onClick={() => {
              clearDirty();
              setEditMode(false);
              router.refresh();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-subtle"
          >
            <X size={13} /> Discard
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save changes
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditMode(true)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-2xl shadow-black/25 transition hover:-translate-y-0.5"
        >
          <Pencil size={15} />
          {saved ? "Saved" : "Edit site"}
        </button>
      )}
    </div>
  );
}
