"use client";

import { useState } from "react";
import { NotFoundGame } from "./NotFoundGame";
import { TicTacToe } from "./TicTacToe";

type Tab = "run" | "ttt";

export function NotFoundArcade() {
  const [tab, setTab] = useState<Tab>("run");

  return (
    <div className="w-full">
      <div className="mb-4 inline-flex rounded-full border border-line bg-card p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("run")}
          className={
            "rounded-full px-4 py-1.5 transition-colors " +
            (tab === "run"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground")
          }
        >
          Desert run
        </button>
        <button
          type="button"
          onClick={() => setTab("ttt")}
          className={
            "rounded-full px-4 py-1.5 transition-colors " +
            (tab === "ttt"
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground")
          }
        >
          Tic-tac-toe
        </button>
      </div>
      {tab === "run" ? <NotFoundGame /> : <TicTacToe />}
    </div>
  );
}
