"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A tiny endless-runner rethemed for byAudarya's desert 404: a lone traveller
// jogs across the dunes and hops over saguaro cacti. Space / ↑ / tap to jump.
// Pure canvas line-art, no assets, works on mobile and desktop.

type State = "ready" | "running" | "over";

interface Cactus {
  x: number;
  w: number;
  h: number;
  arms: boolean;
}

const W = 640;
const H = 200;
const GROUND = H - 26; // dashed horizon line
const RUNNER_X = 64;
const RUNNER_W = 22;
const RUNNER_H = 34;
const GRAVITY = 0.72;
const JUMP_V = -12;

export function NotFoundGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<State>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const game = useRef({
    y: 0,
    vy: 0,
    cacti: [] as Cactus[],
    speed: 6,
    frame: 0,
    score: 0,
    raf: 0,
    running: false,
  });

  const start = useCallback(() => {
    const g = game.current;
    g.y = 0;
    g.vy = 0;
    g.cacti = [];
    g.speed = 6;
    g.frame = 0;
    g.score = 0;
    g.running = true;
    setScore(0);
    setState("running");
  }, []);

  const jump = useCallback(() => {
    const g = game.current;
    if (state === "ready" || state === "over") {
      start();
      return;
    }
    if (g.y === 0) g.vy = JUMP_V;
  }, [state, start]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssInk =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim() || "#171614";
    const ink = cssInk || "#171614";

    function dune(offset: number, baseY: number, amp: number) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= W; x += 20) {
        const y = baseY - Math.sin((x + offset) / 90) * amp - amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
    }

    function drawRunner(topY: number, frame: number, airborne: boolean) {
      if (!ctx) return;
      const cx = RUNNER_X + RUNNER_W / 2;
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // head
      ctx.beginPath();
      ctx.arc(cx, topY + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.beginPath();
      ctx.moveTo(cx, topY + 10);
      ctx.lineTo(cx, topY + 22);
      ctx.stroke();
      // arms (swing)
      const swing = airborne ? 3 : Math.sin(frame / 4) * 5;
      ctx.beginPath();
      ctx.moveTo(cx - 7, topY + 16 + swing);
      ctx.lineTo(cx, topY + 13);
      ctx.lineTo(cx + 7, topY + 16 - swing);
      ctx.stroke();
      // legs
      ctx.beginPath();
      if (airborne) {
        ctx.moveTo(cx, topY + 22);
        ctx.lineTo(cx - 6, topY + 30);
        ctx.moveTo(cx, topY + 22);
        ctx.lineTo(cx + 7, topY + 28);
      } else {
        const step = Math.sin(frame / 3) * 7;
        ctx.moveTo(cx, topY + 22);
        ctx.lineTo(cx - step, topY + 34);
        ctx.moveTo(cx, topY + 22);
        ctx.lineTo(cx + step, topY + 34);
      }
      ctx.stroke();
    }

    function drawCactus(o: Cactus) {
      if (!ctx) return;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const baseY = GROUND;
      const topY = GROUND - o.h;
      const cx = o.x + o.w / 2;
      // trunk
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx, topY);
      ctx.stroke();
      if (o.arms) {
        const armY = topY + o.h * 0.42;
        // left arm
        ctx.beginPath();
        ctx.moveTo(cx, armY);
        ctx.lineTo(cx - o.w / 2, armY);
        ctx.lineTo(cx - o.w / 2, armY - o.h * 0.22);
        ctx.stroke();
        // right arm
        ctx.beginPath();
        ctx.moveTo(cx, armY + 5);
        ctx.lineTo(cx + o.w / 2, armY + 5);
        ctx.lineTo(cx + o.w / 2, armY + 5 - o.h * 0.22);
        ctx.stroke();
      }
    }

    function draw() {
      if (!ctx) return;
      const g = game.current;
      ctx.clearRect(0, 0, W, H);

      // sun
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W - 70, 46, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // parallax dunes
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.08;
      dune(g.frame * 0.4, GROUND - 6, 14);
      ctx.fill();
      ctx.globalAlpha = 0.14;
      dune(g.frame * 0.9 + 120, GROUND + 4, 9);
      ctx.fill();
      ctx.globalAlpha = 1;

      // dashed horizon
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      for (const o of g.cacti) drawCactus(o);

      const topY = GROUND - RUNNER_H - g.y;
      drawRunner(topY, g.frame, g.y > 0);
    }

    function loop() {
      const g = game.current;
      if (!g.running) return;
      g.frame += 1;

      g.vy += GRAVITY;
      g.y -= g.vy;
      if (g.y < 0) {
        g.y = 0;
        g.vy = 0;
      }

      const last = g.cacti[g.cacti.length - 1];
      if (!last || last.x < W - 210 - Math.random() * 180) {
        const h = 26 + Math.random() * 26;
        g.cacti.push({
          x: W,
          w: 14 + Math.random() * 10,
          h,
          arms: Math.random() > 0.35,
        });
      }

      for (const o of g.cacti) o.x -= g.speed;
      while (g.cacti.length && g.cacti[0].x + g.cacti[0].w < 0) g.cacti.shift();

      g.score += 1;
      if (g.score % 6 === 0) setScore(Math.floor(g.score / 6));
      if (g.score % 240 === 0) g.speed += 0.6;

      // collision: horizontal overlap AND not high enough to clear
      for (const o of g.cacti) {
        const overlap =
          RUNNER_X + RUNNER_W - 4 > o.x + 2 && RUNNER_X + 4 < o.x + o.w - 2;
        if (overlap && g.y < o.h - 4) {
          g.running = false;
          const final = Math.floor(g.score / 6);
          setScore(final);
          setBest((b) => {
            const nb = Math.max(b, final);
            try {
              localStorage.setItem("byaudarya_run_best", String(nb));
            } catch {}
            return nb;
          });
          setState("over");
          draw();
          return;
        }
      }

      draw();
      g.raf = requestAnimationFrame(loop);
    }

    const gref = game.current;
    draw();
    if (state === "running") {
      gref.raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(gref.raf);
  }, [state]);

  useEffect(() => {
    try {
      const b = Number(localStorage.getItem("byaudarya_run_best") || "0");
      if (b > 0) setBest(b);
    } catch {}
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl border border-line bg-card"
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault();
          jump();
        }}
        role="button"
        tabIndex={0}
        aria-label="Jump"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block h-auto w-full"
        />
        {state !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 text-center">
            <p className="font-display text-lg font-semibold">
              {state === "over" ? "The desert got you!" : "Cross the desert"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {state === "over"
                ? "Tap or press Space to set off again."
                : "Hop the cacti. Space / ↑ / tap to jump."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
