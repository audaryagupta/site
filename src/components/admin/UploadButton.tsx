"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

// Uploads a file to /api/admin/upload and returns the stored URL via onDone.
export function UploadButton({
  kind,
  accept,
  label,
  onDone,
  className,
}: {
  kind: "audio" | "icon";
  accept: string;
  label: string;
  onDone: (url: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onDone(data.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <span className={className}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium transition hover:bg-subtle disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Upload size={13} />
        )}
        {busy ? "Uploading…" : label}
      </button>
      {err && <span className="ml-2 text-xs text-red-500">{err}</span>}
    </span>
  );
}
