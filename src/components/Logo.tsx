"use client";

import Link from "next/link";
import { useState } from "react";
import { cx } from "@/lib/utils";

/**
 * Brand wordmark. Audarya's original handwritten logo can be dropped into
 * /public/logo.png (light) and /public/logo-dark.png (optional) and this
 * component will use it automatically. Until the file exists it renders a
 * styled fallback wordmark that matches the "by AUDARYA" mark.
 */
/**
 * The brand mark on its own (no link wrapper) so it can be dropped anywhere the
 * brand name would otherwise be typed — including inside other links. Pass
 * `imgClassName` to control the logo image size (defaults to h-8).
 */
export function LogoMark({
  className,
  imgClassName,
}: {
  className?: string;
  imgClassName?: string;
}) {
  const [showImage, setShowImage] = useState(true);
  const img = cx("w-auto", imgClassName || "h-8");

  return (
    <span className={cx("inline-flex items-baseline gap-1.5", className)}>
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="byAudarya"
            className={cx(img, "dark:hidden")}
            onError={() => setShowImage(false)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-dark.png"
            alt="byAudarya"
            className={cx(img, "hidden dark:block")}
            onError={(e) => {
              // Fall back to the light logo in dark mode if no dark variant.
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
          />
        </>
      ) : (
        <>
          <span className="font-display italic text-2xl leading-none">by</span>
          <span className="font-display text-2xl font-semibold tracking-[0.18em] leading-none">
            AUDARYA
          </span>
        </>
      )}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="byAudarya home"
      className={cx("group inline-flex items-baseline", className)}
    >
      <LogoMark />
    </Link>
  );
}
