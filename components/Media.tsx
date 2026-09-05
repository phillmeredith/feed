"use client";

import { useState } from "react";

const RATIOS = {
  hero: "aspect-[16/9]",
  wide: "aspect-[16/10]",
  standard: "aspect-[4/3]",
  square: "aspect-square",
} as const;

export function Media({
  src,
  ratio = "standard",
  /**
   * Lead artwork is often a wide screenshot or a logo card, which `cover` slices
   * through. `contain` shows the whole frame and letterboxes instead.
   */
  fit = "cover",
  className = "",
  onFail,
}: {
  src: string;
  ratio?: keyof typeof RATIOS;
  fit?: "cover" | "contain";
  className?: string;
  /** Lets a card remove itself when its artwork is dead. */
  onFail?: () => void;
}) {
  // Publishers delete and move images constantly; a broken one should leave no
  // trace rather than render the browser's placeholder icon.
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className={`media ${RATIOS[ratio]} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => {
          setFailed(true);
          onFail?.();
        }}
        className={`w-full h-full transition-transform duration-700 group-hover:scale-[1.02] ${
          fit === "contain" ? "object-contain" : "object-cover"
        }`}
      />
    </div>
  );
}
