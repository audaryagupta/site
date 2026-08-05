"use client";

import { useCallback, useEffect, useState } from "react";

// Tic-Tac-Toe against the computer. You are X (first move); the computer is O
// and plays a perfect minimax strategy, so the best you can do is force a draw.

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

function bestMoveForO(b: Board): number {
  let move = -1;
  let bestVal = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i] !== "") continue;
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

// How often the computer plays the perfect move; the rest of the time it makes
// a human-like slip (random legal move). Tuned by simulation so a well-played
// game is winnable roughly half the time, keeping it fun rather than hopeless.
const SKILL = 0.72;

function chooseMoveForO(b: Board): number {
  const empties: number[] = [];
  for (let i = 0; i < 9; i++) if (b[i] === "") empties.push(i);
  if (empties.length === 0) return -1;
  if (Math.random() < SKILL) return bestMoveForO(b);
  return empties[Math.floor(Math.random() * empties.length)];
}

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(""));
  const [busy, setBusy] = useState(false);
  const [tally, setTally] = useState({ w: 0, l: 0, d: 0 });

  const win = winnerOf(board);
  const over = Boolean(win) || isFull(board);

  const reset = useCallback(() => {
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
      const move = chooseMoveForO(board.slice());
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
  }, [board]);

  // Update the running tally once, when a game ends.
  useEffect(() => {
    const w = winnerOf(board);
    if (w) {
      setTally((t) =>
        w.player === "X" ? { ...t, w: t.w + 1 } : { ...t, l: t.l + 1 }
      );
    } else if (isFull(board)) {
      setTally((t) => ({ ...t, d: t.d + 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const status = win
    ? win.player === "X"
      ? "You win! Nicely played."
      : "Computer wins — go again?"
    : isFull(board)
      ? "A draw — well played."
      : busy
        ? "Computer is thinking…"
        : "Your move — you're X.";

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
        <span>You {tally.w}</span>
        <span>Draw {tally.d}</span>
        <span>Computer {tally.l}</span>
      </div>
      <div className="rounded-xl border border-line bg-card p-4">
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
          <p className="text-sm text-muted">{status}</p>
          <button
            type="button"
            onClick={reset}
            className="flex-none rounded-md border border-line px-3 py-1.5 text-sm hover:bg-subtle"
          >
            {over ? "Play again" : "Restart"}
          </button>
        </div>
      </div>
    </div>
  );
}
