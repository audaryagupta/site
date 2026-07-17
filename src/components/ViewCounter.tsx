"use client";

import { useEffect } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});
  }, [slug]);
  return null;
}
