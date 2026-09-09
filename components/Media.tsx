"use client";

import { useState } from "react";

/*
 * The frames a picture is allowed to be cut to. A broadsheet uses a handful
 * of standard crops rather than whatever shape the file arrived in, and the
 * page is calmer for it — the tops of columns line up because the pictures
 * above them are the same height.
 */
const RATIOS = {
  panorama: "aspect-[21/9]",
  hero: "aspect-[16/9]",
  wide: "aspect-[16/10]",
  landscape: "aspect-[3/2]",
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

/**
 * A picture with its credit under it, on a rule.
 *
 * The credit is the outlet rather than a photographer, because the outlet is
 * what we actually know: the artwork comes off their page. Naming it is worth
 * doing anyway — it is the difference between a picture the paper is showing
 * you and a picture the paper is claiming.
 */
export function Plate({
  src,
  credit,
  ratio = "standard",
  fit = "cover",
  className = "",
  frame = "",
  onFail,
}: {
  src: string;
  credit: string;
  ratio?: keyof typeof RATIOS;
  fit?: "cover" | "contain";
  className?: string;
  /** Classes for the picture itself, where a ratio needs a ceiling put on it. */
  frame?: string;
  onFail?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <figure className={className}>
      <Media
        src={src}
        ratio={ratio}
        fit={fit}
        className={frame}
        onFail={() => {
          setFailed(true);
          onFail?.();
        }}
      />
      <figcaption>
        <b className="uppercase tracking-[0.11em] text-micro text-muted font-semibold">
          Photograph
        </b>{" "}
        · {credit}
      </figcaption>
    </figure>
  );
}
