"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface Result {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else {
      setQ("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search writings…"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <p className="px-4 py-6 text-sm text-muted">Searching…</p>
          )}
          {!loading && q && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted">No results for “{q}”.</p>
          )}
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/writings/${r.slug}`}
              onClick={onClose}
              className="block border-b border-line px-4 py-3 transition last:border-0 hover:bg-subtle"
            >
              <p className="font-display text-base">{r.title}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                {r.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
