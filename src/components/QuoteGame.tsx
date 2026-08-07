"use client";

import { useState } from "react";
import { Check, Download, RotateCcw, X } from "lucide-react";
import type { QuoteRound } from "@/lib/quotes";
import { cx } from "@/lib/utils";

export function QuoteGame({ rounds }: { rounds: QuoteRound[] }) {
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [name, setName] = useState("");

  const round = rounds[current];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === round.mine) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 >= rounds.length) {
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setPicked(null);
  }

  function restart() {
    setCurrent(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  function downloadCertificate() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (logo?: HTMLImageElement) => {
      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Border
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      ctx.lineWidth = 1;
      ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";

      if (logo && logo.width) {
        const h = 56;
        const w = (logo.width / logo.height) * h;
        ctx.drawImage(logo, (canvas.width - w) / 2, 120, w, h);
      } else {
        ctx.font = "italic 30px Georgia, serif";
        ctx.fillText("byAudarya", canvas.width / 2, 170);
      }

      drawBody();

      const link = document.createElement("a");
      link.download = "byaudarya-who-said-it-certificate.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    const drawBody = () => {
    ctx.font = "22px Georgia, serif";
    ctx.fillText("CERTIFICATE OF CURIOSITY", canvas.width / 2, 220);

    ctx.font = "bold 64px Georgia, serif";
    ctx.fillText("Who Said It?", canvas.width / 2, 340);

    ctx.font = "26px Georgia, serif";
    ctx.fillText("This certifies that", canvas.width / 2, 430);

    ctx.font = "bold 44px Georgia, serif";
    ctx.fillText(name || "A curious reader", canvas.width / 2, 500);

    ctx.font = "26px Georgia, serif";
    ctx.fillText(
      `correctly identified ${score} of ${rounds.length} of Audarya's quotes.`,
      canvas.width / 2,
      570
    );

    ctx.font = "bold 40px Georgia, serif";
    const pct = Math.round((score / rounds.length) * 100);
    ctx.fillText(`Score: ${pct}%`, canvas.width / 2, 650);

    ctx.font = "20px Georgia, serif";
    ctx.fillText(
      new Date().toLocaleDateString(),
      canvas.width / 2,
      730
    );
    ctx.fillText("www.byaudarya.com", canvas.width / 2, 765);
    };

    const logo = new Image();
    logo.onload = () => render(logo);
    logo.onerror = () => render();
    logo.src = "/logo.png";
  }

  if (finished) {
    const pct = Math.round((score / rounds.length) * 100);
    return (
      <div className="rounded-xl border border-line p-6 text-center animate-fade-up">
        <p className="text-xs uppercase tracking-widest text-muted">
          Your result
        </p>
        <p className="mt-3 font-display text-5xl font-semibold">
          {score}/{rounds.length}
        </p>
        <p className="mt-2 text-sm text-muted">
          {pct >= 80
            ? "Uncanny. You clearly read closely."
            : pct >= 40
              ? "Not bad — you have an ear for it."
              : "The famous ones fooled you. Read a few more essays?"}
        </p>

        <div className="mx-auto mt-6 max-w-xs">
          <label className="mb-2 block text-left text-xs uppercase tracking-widest text-muted">
            Name on certificate
          </label>
          <input
            className="h-11 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={downloadCertificate}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            <Download size={16} /> Download certificate
          </button>
          <button
            onClick={restart}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-5 text-sm transition hover:bg-subtle"
          >
            <RotateCcw size={16} /> Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line p-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Round {current + 1} of {rounds.length}
        </span>
        <span>Score: {score}</span>
      </div>

      <div className="mt-5 space-y-3">
        {round.options.map((q, i) => {
          const isMine = i === round.mine;
          const revealed = picked !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              className={cx(
                "flex w-full items-start gap-3 rounded-lg border p-4 text-left font-serif text-lg transition",
                !revealed && "hover:bg-subtle",
                revealed && isMine && "border-foreground bg-subtle",
                revealed &&
                  !isMine &&
                  i === picked &&
                  "border-line opacity-60"
              )}
            >
              {revealed && (
                <span className="mt-1 shrink-0">
                  {isMine ? <Check size={18} /> : <X size={18} />}
                </span>
              )}
              <span>&ldquo;{q}&rdquo;</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-5 flex items-center justify-between animate-fade-up">
          <p className="text-sm text-muted">
            {picked === round.mine
              ? "Correct — that one's mine."
              : "Not mine. The others are famous lines."}
          </p>
          <button
            onClick={next}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
          >
            {current + 1 >= rounds.length ? "See result" : "Next round"}
          </button>
        </div>
      )}
    </div>
  );
}
