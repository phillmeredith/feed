"use client";

import { useState } from "react";
import Image from "next/image";

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
  /**
   * Roughly how wide this picture is on the page, as a CSS `sizes` list. The
   * optimiser serves the rendition that fits rather than the largest one; get
   * this wrong and a thumbnail downloads a 2048px file.
   */
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw",
  /** The one or two pictures above the fold; everything else waits. */
  priority = false,
  className = "",
  onFail,
}: {
  src: string;
  ratio?: keyof typeof RATIOS;
  fit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Lets a card remove itself when its artwork is dead. */
  onFail?: () => void;
}) {
  // Publishers delete and move images constantly; a broken one should leave no
  // trace rather than render the browser's placeholder icon.
  const [failed, setFailed] = useState(false);
  /*
   * One retry, unoptimised, before giving up.
   *
   * The optimiser will not fetch every URL a feed hands over — a redirect it
   * declines to follow, a host that blocks it, a file that turns out not to
   * be an image. Those used to be indistinguishable from a dead picture, so
   * the card dropped artwork that a plain <img> would have shown. Now a
   * failure through the optimiser falls back to the publisher's own URL, and
   * only a failure of that counts as dead.
   */
  const [unoptimized, setUnoptimized] = useState(false);
  if (!src || failed) return null;

  return (
    <div className={`media ${RATIOS[ratio]} ${className}`}>
      {/*
        * `fill` rather than a width and a height: the box already has its
        * aspect ratio from the class above, and the intrinsic size of a
        * publisher's file is not known here and differs for every one of them.
        */}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={62}
        // The optimiser refuses some publisher URLs — a redirect it will not
        // follow, an SVG, a file that is not an image at all. Falling back to
        // the URL itself keeps a working picture where one exists.
        unoptimized={unoptimized}
        onError={() => {
          if (!unoptimized) {
            setUnoptimized(true);
            return;
          }
          setFailed(true);
          onFail?.();
        }}
        className={`transition-transform duration-700 group-hover:scale-[1.02] ${
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
  sizes,
  priority = false,
  className = "",
  frame = "",
  onFail,
}: {
  src: string;
  credit: string;
  ratio?: keyof typeof RATIOS;
  fit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
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
        sizes={sizes}
        priority={priority}
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
