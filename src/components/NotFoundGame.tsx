"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A tiny Chrome-dino-style endless runner, rethemed for byAudarya: instead of a
// dinosaur you hop a stack of books over runaway ink blots. Space / ↑ / tap to
// jump. Pure canvas, no assets, works on mobile and desktop.

type State = "ready" | "running" | "over";

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

const W = 640;
const H = 200;
const GROUND = H - 28;
const RUNNER_X = 60;
const RUNNER_W = 26;
const GRAVITY = 0.7;
const JUMP_V = -11.5;

export function NotFoundGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<State>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  // Mutable game state kept in a ref so the animation loop doesn't re-create.
  const game = useRef({
    y: 0, // runner offset above ground (0 = on ground)
    vy: 0,
    obstacles: [] as Obstacle[],
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
    g.obstacles = [];
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

    function draw() {
      if (!ctx) return;
      const g = game.current;
      ctx.clearRect(0, 0, W, H);

      // Ground line.
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + RUNNER_W);
      ctx.lineTo(W, GROUND + RUNNER_W);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Runner: a little stack of books.
      const ry = GROUND - g.y;
      ctx.fillStyle = ink;
      const bookH = RUNNER_W / 3;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(
          RUNNER_X + (i % 2 === 0 ? 0 : 2),
          ry + i * bookH,
          RUNNER_W - (i % 2 === 0 ? 0 : 2),
          bookH - 2
        );
      }

      // Obstacles: ink blots.
      for (const o of g.obstacles) {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(
          o.x + o.w / 2,
          GROUND + RUNNER_W - o.h / 2,
          o.w / 2,
          o.h / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    function loop() {
      const g = game.current;
      if (!g.running) return;
      g.frame += 1;

      // Physics.
      g.vy += GRAVITY;
      g.y -= g.vy;
      if (g.y < 0) {
        g.y = 0;
        g.vy = 0;
      }

      // Spawn obstacles at a randomised cadence.
      const last = g.obstacles[g.obstacles.length - 1];
      if (!last || last.x < W - 220 - Math.random() * 160) {
        const h = 22 + Math.random() * 20;
        g.obstacles.push({ x: W, w: 16 + Math.random() * 14, h });
      }

      // Move + cull, scoring per cleared obstacle.
      for (const o of g.obstacles) o.x -= g.speed;
      while (g.obstacles.length && g.obstacles[0].x + g.obstacles[0].w < 0) {
        g.obstacles.shift();
      }

      g.score += 1;
      if (g.score % 6 === 0) setScore(Math.floor(g.score / 6));
      if (g.score % 240 === 0) g.speed += 0.6;

      // Collision.
      const ry = GROUND - g.y;
      for (const o of g.obstacles) {
        const ox = o.x;
        const oy = GROUND + RUNNER_W - o.h;
        const hit =
          RUNNER_X + RUNNER_W > ox + 3 &&
          RUNNER_X < ox + o.w - 3 &&
          ry + RUNNER_W > oy + 3;
        if (hit) {
          g.running = false;
          const final = Math.floor(g.score / 6);
          setScore(final);
          setBest((b) => {
            const nb = Math.max(b, final);
            try {
              localStorage.setItem("dino_best", String(nb));
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
      const b = Number(localStorage.getItem("dino_best") || "0");
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
              {state === "over" ? "Ink blot got you!" : "While you're here…"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {state === "over"
                ? "Tap or press Space to play again."
                : "Hop the books over the ink blots. Space / ↑ / tap to jump."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
