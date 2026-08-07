"use client";

import { useEffect, useState } from "react";
import { Eye, Heart } from "lucide-react";

// Counts a view (once per session) and shows public view/like counts with a
// like button. The counts passed in are the PUBLIC figures (real + boost);
// the dashboard shows the real numbers separately.
export function ArticleEngagement({
  slug,
  views,
  likes,
}: {
  slug: string;
  views: number;
  likes: number;
}) {
  const [likeCount, setLikeCount] = useState(likes);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const key = `viewed:${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});
    }
    if (localStorage.getItem(`liked:${slug}`)) setLiked(true);
  }, [slug]);

  async function like() {
    if (liked) return;
    setLiked(true);
    setLikeCount((n) => n + 1);
    localStorage.setItem(`liked:${slug}`, "1");
    try {
      const res = await fetch(`/api/likes/${slug}`, { method: "POST" });
      const data = await res.json();
      if (typeof data.likes === "number") setLikeCount(data.likes);
    } catch {
      /* keep optimistic value */
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <div className="flex items-center justify-center gap-5 text-sm text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Eye size={15} /> {fmt(views)} views
      </span>
      <button
        onClick={like}
        disabled={liked}
        className="inline-flex items-center gap-1.5 transition hover:text-foreground disabled:cursor-default"
        aria-label="Like this article"
      >
        <Heart
          size={15}
          className={liked ? "fill-red-500 text-red-500" : ""}
        />{" "}
        {fmt(likeCount)} {likeCount === 1 ? "like" : "likes"}
      </button>
    </div>
  );
}
