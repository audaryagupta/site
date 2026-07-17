"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";

// High-res A4 page (≈150 dpi) so the flattened export stays crisp.
const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 96;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function LetterheadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigImgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  const [title, setTitle] = useState("Letter");
  const [place, setPlace] = useState("New Delhi");
  const [date, setDate] = useState(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
  );
  const [body, setBody] = useState(
    "Dear …,\n\n\n\nWarm regards,\nAudarya Gupta"
  );
  const [color, setColor] = useState("#8a6d2b");
  const [showSeal, setShowSeal] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [hasSig, setHasSig] = useState(false);
  const [sigBox, setSigBox] = useState<Box>({
    x: MARGIN,
    y: PAGE_H - 430,
    w: 320,
    h: 150,
  });
  const [saveToDrive, setSaveToDrive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Load the brand logo once (used in the header and seal, tinted).
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoRef.current = img;
      draw();
    };
    img.src = "/logo.png";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tint an image's opaque pixels to `color`; returns an offscreen canvas.
  const tinted = useCallback(
    (img: HTMLImageElement, w: number, h: number, alpha: number) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext("2d")!;
      cx.drawImage(img, 0, 0, w, h);
      cx.globalCompositeOperation = "source-in";
      cx.fillStyle = color;
      cx.fillRect(0, 0, w, h);
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const ox = out.getContext("2d")!;
      ox.globalAlpha = alpha;
      ox.drawImage(c, 0, 0);
      return out;
    },
    [color]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Watermark — faint diagonal repeated brand logo, same colour as the seal.
    if (showWatermark && logoRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.translate(PAGE_W / 2, PAGE_H / 2);
      ctx.rotate((-30 * Math.PI) / 180);
      const wmW = 360;
      const wmH = 360 * (logoRef.current.height / logoRef.current.width || 0.4);
      const wm = tinted(logoRef.current, wmW, wmH, 1);
      for (let gy = -PAGE_H; gy < PAGE_H; gy += wmH + 220) {
        for (let gx = -PAGE_W; gx < PAGE_W; gx += wmW + 160) {
          ctx.drawImage(wm, gx, gy);
        }
      }
      ctx.restore();
    }

    // Header logo (tinted to the accent colour), centered.
    if (logoRef.current) {
      const lw = 260;
      const lh = 260 * (logoRef.current.height / logoRef.current.width || 0.35);
      const logo = tinted(logoRef.current, lw, lh, 0.95);
      ctx.drawImage(logo, (PAGE_W - lw) / 2, 60);
    }

    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";

    // Title
    ctx.font = "600 40px Georgia, serif";
    ctx.fillText(title, MARGIN, 230);

    // Place / date (right aligned)
    ctx.font = "22px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#444444";
    ctx.fillText(`${place} · ${date}`, PAGE_W - MARGIN, 236);
    ctx.textAlign = "left";

    // Divider
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, 300);
    ctx.lineTo(PAGE_W - MARGIN, 300);
    ctx.stroke();

    // Body — wrapped
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "26px Georgia, serif";
    const maxW = PAGE_W - MARGIN * 2;
    let y = 350;
    const lineH = 40;
    for (const para of body.split("\n")) {
      if (para.trim() === "") {
        y += lineH;
        continue;
      }
      let line = "";
      for (const word of para.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, MARGIN, y);
          line = word;
          y += lineH;
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, MARGIN, y);
        y += lineH;
      }
    }

    // Signature (tinted so it converges with the watermark/seal colour).
    if (hasSig && sigImgRef.current) {
      const t = tinted(sigImgRef.current, sigBox.w, sigBox.h, 0.9);
      ctx.drawImage(t, sigBox.x, sigBox.y);
    }

    // Seal — concentric rings + tinted logo, overlapping the signature corner.
    if (showSeal) {
      const r = 82;
      const cx = sigBox.x + sigBox.w - 20;
      const cy = sigBox.y + sigBox.h - 10;
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
      ctx.stroke();
      if (logoRef.current) {
        const s = r;
        const emblem = tinted(logoRef.current, s, s * (logoRef.current.height / logoRef.current.width || 0.35), 0.9);
        ctx.drawImage(emblem, cx - s / 2, cy - (emblem.height) / 2);
      }
      ctx.restore();
    }
  }, [title, place, date, body, color, showSeal, showWatermark, hasSig, sigBox, tinted]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- signature drag / resize ----
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; box: Box } | null>(null);

  function toCanvas(e: React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * PAGE_W,
      y: ((e.clientY - rect.top) / rect.height) * PAGE_H,
    };
  }

  function onDown(e: React.PointerEvent) {
    if (!hasSig) return;
    const p = toCanvas(e);
    const handle = { x: sigBox.x + sigBox.w, y: sigBox.y + sigBox.h };
    const near = Math.hypot(p.x - handle.x, p.y - handle.y) < 40;
    const inside =
      p.x >= sigBox.x &&
      p.x <= sigBox.x + sigBox.w &&
      p.y >= sigBox.y &&
      p.y <= sigBox.y + sigBox.h;
    if (near) drag.current = { mode: "resize", sx: p.x, sy: p.y, box: { ...sigBox } };
    else if (inside) drag.current = { mode: "move", sx: p.x, sy: p.y, box: { ...sigBox } };
    if (drag.current) (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const p = toCanvas(e);
    const dx = p.x - drag.current.sx;
    const dy = p.y - drag.current.sy;
    const b = drag.current.box;
    if (drag.current.mode === "move") {
      setSigBox({ ...b, x: b.x + dx, y: b.y + dy });
    } else {
      const w = Math.max(80, b.w + dx);
      setSigBox({ ...b, w, h: (b.h / b.w) * w });
    }
  }

  function onUp() {
    drag.current = null;
  }

  function onSig(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        sigImgRef.current = img;
        const w = 320;
        setSigBox((b) => ({ ...b, w, h: (img.height / img.width) * w }));
        setHasSig(true);
        draw();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function exportPdf() {
    setBusy(true);
    setMsg("");
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const res = await fetch("/api/admin/letterhead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, title, saveToDrive }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^\w-]+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      const driveId = res.headers.get("X-Drive-File-Id");
      setMsg(driveId ? "Downloaded + saved to Google Drive." : "Downloaded.");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Letterhead</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Compose on the letterhead, drop in a signature and drag/resize it. On
        export the signature, seal and watermark are fused into the page as a
        flattened image — none of it is selectable or copyable (Ctrl+A won&apos;t
        pick it up). Use a transparent-background PNG signature for best results.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-lg border border-line bg-subtle p-3">
          <canvas
            ref={canvasRef}
            width={PAGE_W}
            height={PAGE_H}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            className="mx-auto block w-full max-w-[520px] cursor-move touch-none bg-white shadow"
            style={{ aspectRatio: `${PAGE_W}/${PAGE_H}` }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Field label="Title">
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Place">
              <input className={input} value={place} onChange={(e) => setPlace(e.target.value)} />
            </Field>
            <Field label="Date">
              <input className={input} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Body">
            <textarea
              className={`${input} min-h-48 font-serif`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle">
              <Upload size={15} />
              <span>{hasSig ? "Replace signature" : "Upload signature"}</span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onSig} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              Accent
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded border border-line" />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showSeal} onChange={(e) => setShowSeal(e.target.checked)} />
              Seal
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} />
              Watermark
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={saveToDrive} onChange={(e) => setSaveToDrive(e.target.checked)} />
              Also save to Drive
            </label>
          </div>

          <button
            onClick={exportPdf}
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {busy ? "Generating…" : "Generate signed PDF"}
          </button>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
