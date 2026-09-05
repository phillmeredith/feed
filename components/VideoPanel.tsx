"use client";

import { useState } from "react";
import type { Video } from "@/lib/video";

/**
 * Video coverage, played here rather than somewhere else.
 *
 * The site's rule is that a reader never has to leave to see the thing, and
 * that applies to a review on video as much as one in prose. But seven
 * embedded players on a page is seven third-party frames loading before
 * anyone has asked for one, so each starts as its own still and becomes a
 * player on click. Nothing reaches YouTube until a reader presses play.
 */
function compact(views: number) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}K views`;
  return `${views} views`;
}

function Item({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);

  const when = new Date(video.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <figure className="group">
      <div className="media aspect-video bg-surface">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${video.title}`}
            className="relative block w-full h-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
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

      <figcaption className="mt-3">
        <p className="font-body font-semibold text-[15px] leading-snug line-clamp-2">
          {video.title}
        </p>
        <p className="kicker text-[9px] text-faint mt-2">
          {video.channel}
          <span className="mx-2 text-rule">/</span>
          {when}
          <span className="mx-2 text-rule">/</span>
          {compact(video.views)}
        </p>
      </figcaption>
    </figure>
  );
}

export function VideoPanel({
  videos,
  title = "On video",
  standfirst,
}: {
  videos: Video[];
  title?: string;
  standfirst?: string;
}) {
  if (videos.length === 0) return null;

  return (
    <section>
      <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
        {title}
      </h2>
      {standfirst && (
        <p className="font-serif italic text-muted mt-4 max-w-2xl">
          {standfirst}
        </p>
      )}
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <Item key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}
