"use client";

import { useRef, useState } from "react";
import { Loader2, Move, Upload } from "lucide-react";
import { cx } from "@/lib/utils";
import type { ImageValue } from "@/lib/siteContentTypes";
import {
  getValue,
  seedValue,
  updateValue,
  useEditorSnapshot,
} from "./editorStore";

// An editable framed image: swap the photo, resize the frame, round its
// corners, and drag the photo to reposition it inside the frame.
export function EditableImage({
  id,
  src,
  alt,
  fit = "cover",
  posX = 50,
  posY = 50,
  height = null,
  radius = 24,
  className,
}: {
  id: string;
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  posX?: number;
  posY?: number;
  height?: number | null;
  radius?: number;
  className?: string;
}) {
  const initial: ImageValue = { src, fit, posX, posY, height, radius };
  seedValue(id, initial);
  const snap = useEditorSnapshot();
  const value = getValue<ImageValue>(id, initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);

  const editing = snap.canEdit && snap.editMode;

  const frameStyle: React.CSSProperties = {
    borderRadius: value.radius,
    ...(value.height ? { height: value.height } : {}),
  };
  const imgStyle: React.CSSProperties = {
    objectFit: value.fit,
    objectPosition: `${value.posX}% ${value.posY}%`,
  };

  async function upload(file: File) {
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      updateValue(id, { src: data.url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function onDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    updateValue(id, { posX: Math.round(x), posY: Math.round(y) });
  }

  return (
    <div className="relative">
      <div
        className={cx("overflow-hidden", className, editing && "site-edit-target")}
        style={frameStyle}
        onMouseDown={() => {
          if (editing) dragging.current = true;
        }}
        onMouseUp={() => (dragging.current = false)}
        onMouseLeave={() => (dragging.current = false)}
        onMouseMove={onDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.src}
          alt={alt}
          draggable={false}
          className={cx("h-full w-full", editing && "cursor-move select-none")}
          style={imgStyle}
        />
      </div>

      {editing && (
        <div className="absolute left-2 top-2 z-10 w-56 space-y-2 rounded-xl border border-line bg-card/95 p-3 shadow-xl backdrop-blur">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
            <Move size={12} /> Drag photo to reposition
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-line py-1.5 text-xs hover:bg-subtle disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {busy ? "Uploading…" : "Replace photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          {err && <p className="text-[11px] text-red-500">{err}</p>}

          <label className="block text-[11px] text-muted">
            Frame height {value.height ? `${value.height}px` : "auto"}
            <input
              type="range"
              min={180}
              max={700}
              step={10}
              value={value.height ?? 380}
              onChange={(e) => updateValue(id, { height: Number(e.target.value) })}
              className="w-full"
            />
          </label>

          <label className="block text-[11px] text-muted">
            Corner rounding {value.radius}px
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={value.radius}
              onChange={(e) => updateValue(id, { radius: Number(e.target.value) })}
              className="w-full"
            />
          </label>

          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Fit</span>
            <div className="flex gap-1">
              {(["cover", "contain"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => updateValue(id, { fit: f })}
                  className={cx(
                    "rounded-md border px-2 py-1",
                    value.fit === f ? "border-foreground bg-foreground text-background" : "border-line"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
