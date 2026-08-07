"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Tic-Tac-Toe against the computer. You are X (first move); the computer is O.
// The AI adapts: it gets harder the longer you play, and it will never let
// anyone win three games in a row — after two straight wins by either side it
// swings the next game so that streak can't continue.

type Cell = "X" | "O" | "";
type Board = Cell[];

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(b: Board): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { player: b[a], line };
    }
  }
  return null;
}

function isFull(b: Board): boolean {
  return b.every((c) => c !== "");
}

// Minimax: O maximises, X minimises. Depth is used so the AI prefers quicker
// wins and slower losses, which makes it feel sharp.
function minimax(b: Board, isO: boolean, depth: number): number {
  const win = winnerOf(b);
  if (win) return win.player === "O" ? 10 - depth : depth - 10;
  if (isFull(b)) return 0;

  let best = isO ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i] !== "") continue;
    b[i] = isO ? "O" : "X";
    const val = minimax(b, !isO, depth + 1);
    b[i] = "";
    best = isO ? Math.max(best, val) : Math.min(best, val);
  }
  return best;
}

function emptyCells(b: Board): number[] {
  const e: number[] = [];
  for (let i = 0; i < 9; i++) if (b[i] === "") e.push(i);
  return e;
}

function bestMoveForO(b: Board): number {
  let move = -1;
  let bestVal = -Infinity;
  for (const i of emptyCells(b)) {
    b[i] = "O";
    const val = minimax(b, false, 0);
    b[i] = "";
    if (val > bestVal) {
      bestVal = val;
      move = i;
    }
  }
  return move;
}

function completesLine(b: Board, i: number, player: Cell): boolean {
  const b2 = b.slice();
  b2[i] = player;
  return winnerOf(b2)?.player === player;
}

// A deliberately-losing move: never complete O's own three, so the computer
// cannot win this game (used to break its own two-win streak).
function throwMoveForO(b: Board): number {
  const empties = emptyCells(b);
  if (!empties.length) return -1;
  const safe = empties.filter((i) => !completesLine(b, i, "O"));
  const pool = safe.length ? safe : empties;
  return pool[Math.floor(Math.random() * pool.length)];
}

type Streak = { who: Cell | null; n: number };

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(""));
  const [busy, setBusy] = useState(false);
  const [tally, setTally] = useState({ w: 0, l: 0, d: 0 });
  const [streak, setStreak] = useState<Streak>({ who: null, n: 0 });

  // Refs mirror the streak/games so the move picker reads fresh values without
  // depending on effect-closure timing.
  const gamesRef = useRef(0);
  const streakRef = useRef<Streak>({ who: null, n: 0 });
  const settledRef = useRef(false);

  const win = winnerOf(board);
  const over = Boolean(win) || isFull(board);

  const reset = useCallback(() => {
    settledRef.current = false;
    setBoard(Array(9).fill(""));
    setBusy(false);
  }, []);

  function play(i: number) {
    if (busy || over || board[i] !== "") return;
    const next = board.slice();
    next[i] = "X";
    setBoard(next);
    setBusy(true);
  }

  // Pick the computer's move for the current difficulty / streak state.
  const pickMoveForO = useCallback((b: Board): number => {
    const empties = emptyCells(b);
    if (!empties.length) return -1;
    const s = streakRef.current;
    // Anti three-in-a-row: after two straight wins by one side, force the swing.
    if (s.who === "X" && s.n >= 2) return bestMoveForO(b); // perfect → you can't 3-peat
    if (s.who === "O" && s.n >= 2) return throwMoveForO(b); // throw → house can't 3-peat
    // Otherwise ramp difficulty with games played (55% → 92% perfect play).
    const skill = Math.min(0.92, 0.55 + 0.06 * gamesRef.current);
    if (Math.random() < skill) return bestMoveForO(b);
    return empties[Math.floor(Math.random() * empties.length)];
  }, []);

  // Computer responds after the player's move.
  useEffect(() => {
    if (winnerOf(board) || isFull(board)) return;
    const xCount = board.filter((c) => c === "X").length;
    const oCount = board.filter((c) => c === "O").length;
    if (xCount <= oCount) {
      setBusy(false);
      return;
    }
    const t = setTimeout(() => {
      const move = pickMoveForO(board.slice());
      if (move >= 0) {
        setBoard((prev) => {
          if (prev[move] !== "" || winnerOf(prev) || isFull(prev)) return prev;
          const nb = prev.slice();
          nb[move] = "O";
          return nb;
        });
      }
      setBusy(false);
    }, 320);
    return () => clearTimeout(t);
  }, [board, pickMoveForO]);

  // Record the result once, when a game ends: tally, games played, streak.
  useEffect(() => {
    if (!over || settledRef.current) return;
    settledRef.current = true;

    const w = winnerOf(board);
    const result: Cell | "D" = w ? (w.player as Cell) : "D";

    setTally((t) =>
      result === "X"
        ? { ...t, w: t.w + 1 }
        : result === "O"
          ? { ...t, l: t.l + 1 }
          : { ...t, d: t.d + 1 }
    );

    gamesRef.current += 1;

    const prev = streakRef.current;
    const next: Streak =
      result === "D"
        ? { who: null, n: 0 }
        : prev.who === result
          ? { who: result, n: prev.n + 1 }
          : { who: result, n: 1 };
    streakRef.current = next;
    setStreak(next);
  }, [over, board]);

  const outcome: "X" | "O" | "D" | null = win
    ? (win.player as "X" | "O")
    : isFull(board)
      ? "D"
      : null;

  const bannerTitle =
    outcome === "X"
      ? "You win!"
      : outcome === "O"
        ? "Computer wins"
        : "It's a draw";

  const bannerSub =
    outcome === "X"
      ? streak.who === "X" && streak.n >= 2
        ? "Two in a row — the house won't let that happen again."
        : "Nicely played."
      : outcome === "O"
        ? streak.who === "O" && streak.n >= 2
          ? "Two straight for the house — it'll ease off next game."
          : "Better luck next round."
        : "Evenly matched.";

  const statusLine = busy ? "Computer is thinking…" : "Your move — you're X.";

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
        <span>You {tally.w}</span>
        <span>Draw {tally.d}</span>
        <span>Computer {tally.l}</span>
      </div>
      <div className="relative rounded-xl border border-line bg-card p-4">
        <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2">
          {board.map((c, i) => {
            const winning = win?.line.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => play(i)}
                disabled={busy || over || c !== ""}
                aria-label={`Cell ${i + 1}${c ? `, ${c}` : ""}`}
                className={
                  "flex aspect-square items-center justify-center rounded-lg border font-display text-3xl font-semibold transition-colors " +
                  (winning
                    ? "border-foreground bg-foreground text-background"
                    : "border-line hover:bg-subtle disabled:hover:bg-transparent")
                }
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{statusLine}</p>
          <button
            type="button"
            onClick={reset}
            className="flex-none rounded-md border border-line px-3 py-1.5 text-sm hover:bg-subtle"
          >
            Restart
          </button>
        </div>

        {over && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/25 px-4 text-center backdrop-blur-[1px]">
            <div className="flex w-full max-w-[16rem] flex-col items-center gap-2.5 rounded-2xl border border-line bg-background px-6 py-6 shadow-2xl">
              <span
                className={
                  "inline-flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-xl font-semibold " +
                  (outcome === "X"
                    ? "border-foreground bg-foreground text-background"
                    : "border-line text-foreground")
                }
                aria-hidden
              >
                {outcome === "X" ? "★" : outcome === "O" ? "O" : "="}
              </span>
              <p className="font-display text-2xl font-semibold">{bannerTitle}</p>
              <p className="text-sm text-muted">{bannerSub}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-1 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
