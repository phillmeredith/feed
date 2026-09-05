"use client";

import { useState } from "react";
import { KIND_LABELS, type Highlight } from "@/lib/highlights";

/**
 * The official highlights for a session, played here.
 *
 * Same bargain as everywhere else on the site: the reader shouldn't have to
 * go somewhere else to see the thing. Each starts as a still, so no third
 * party hears about a visit until someone presses play.
 */
function Reel({ highlight }: { highlight: Highlight }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure>
      <div className="media aspect-video bg-surface group">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${highlight.videoId}?autoplay=1&rel=0`}
            title={highlight.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${highlight.title}`}
            className="relative block w-full h-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${highlight.videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-void/70 border border-paper/25 text-paper text-lg pl-1 transition-colors group-hover:bg-void/85 group-hover:text-accent">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="kicker text-[9px] text-faint mt-3">
        {KIND_LABELS[highlight.kind]}
        <span className="mx-2 text-rule">/</span>
        {highlight.channel}
      </figcaption>
    </figure>
  );
}

export function HighlightReel({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length === 0) return null;
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {highlights.map((h) => (
        <Reel key={h.videoId} highlight={h} />
      ))}
    </div>
  );
}
