"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";
import { relativeDate } from "@/lib/format";

export { relativeDate };
import { Media } from "./Media";
import { RelativeTime } from "./RelativeTime";

export function Meta({
  article,
  showDesk = false,
}: {
  article: Article;
  showDesk?: boolean;
}) {
  const desk = categoryBySlug(article.category);
  return (
    <p className="kicker text-micro text-faint">
      {showDesk && desk && (
        <>
          <span className="text-accent">{desk.short}</span>
          <span className="mx-2 text-rule">/</span>
        </>
      )}
      {article.source}
      <span className="mx-2 text-rule">/</span>
      <RelativeTime iso={article.publishedAt} />
    </p>
  );
}

/** Full-width opener: oversized condensed headline beside the artwork. */
export function LeadCard({ article }: { article: Article }) {
  const desk = categoryBySlug(article.category);
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="block">
        <div
          className={
            article.image
              ? "grid gap-6 lg:grid-cols-2 lg:items-center"
              : "max-w-4xl"
          }
        >
          <div className="order-2 lg:order-1">
            <p className="kicker text-label text-accent">{desk?.label}</p>
            <h2 className="headline mt-4 text-title group-hover:text-accent transition-colors">
              {article.headline}
            </h2>
            {article.dek && (
              <p className="mt-5 text-lede leading-relaxed text-muted max-w-xl">
                {article.dek}
              </p>
            )}
            <div className="mt-5">
              <Meta article={article} />
            </div>
          </div>

          {article.image && (
            <div className="order-1 lg:order-2">
              <Media
                src={article.image}
                ratio="wide"
                fit="contain"
                onFail={() => setBroken(true)}
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

export function FeatureCard({ article }: { article: Article }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="block">
        {article.image && (
          <Media src={article.image} ratio="wide" onFail={() => setBroken(true)} />
        )}
        <h3
          className={`headline text-subhead line-clamp-2 group-hover:text-accent transition-colors ${
            article.image ? "mt-4" : ""
          }`}
        >
          {article.headline}
        </h3>
        {article.dek && (
          <p className="mt-3 text-small leading-relaxed text-muted line-clamp-3">
            {article.dek}
          </p>
        )}
        <div className="mt-3">
          <Meta article={article} />
        </div>
      </Link>
    </article>
  );
}

/**
 * Section-front opener: artwork above, headline beneath.
 *
 * LeadCard splits itself in two and needs the width of the page to do it. In
 * a section front it sits in a column beside a rail, and splitting a column
 * gave a 54px headline six characters of line to work with. Stacking keeps
 * the scale and gives the words somewhere to go.
 */
export function StackedLead({ article }: { article: Article }) {
  const desk = categoryBySlug(article.category);
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="block">
        {article.image && (
          <Media
            src={article.image}
            ratio="wide"
            /* Lead artwork is often a title plate or a logo card; `cover`
               slices through those at this size. */
            fit="contain"
            onFail={() => setBroken(true)}
          />
        )}
        <p className="kicker text-label text-accent mt-6">{desk?.label}</p>
        <h2 className="headline mt-3 text-headline group-hover:text-accent transition-colors">
          {article.headline}
        </h2>
        {article.dek && (
          <p className="mt-4 text-lede leading-relaxed text-muted max-w-2xl">
            {article.dek}
          </p>
        )}
        <div className="mt-4">
          <Meta article={article} />
        </div>
      </Link>
    </article>
  );
}

/** Text-only row for dense lists. */
export function ListCard({
  article,
  showDesk = false,
}: {
  article: Article;
  showDesk?: boolean;
}) {
  return (
    <article className="group border-t border-rule pt-4">
      <Link href={`/story/${article.id}`} className="block">
        {/*
          * `truncate` sets `white-space: nowrap`, which makes the headline's
          * min-content width the width of the whole headline. In a one-column
          * grid — every one of these grids on a phone — the track cannot go
          * below that, so the desk pages were laying out 1200px wide inside a
          * 390px screen. Wrapping to two lines costs nothing and reads better
          * on a narrow column; the single-line rule returns at `sm`, where the
          * grids switch to `minmax(0, 1fr)` tracks and can clip safely.
          */}
        <h3 className="font-body font-semibold text-lede leading-snug break-words line-clamp-2 sm:line-clamp-none sm:truncate group-hover:text-accent transition-colors">
          {article.headline}
        </h3>
        <div className="mt-2">
          <Meta article={article} showDesk={showDesk} />
        </div>
      </Link>
    </article>
  );
}

/** Thumbnail row, used in sidebars. */
export function ThumbCard({ article }: { article: Article }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <article className="group border-t border-rule pt-4">
      <Link href={`/story/${article.id}`} className="flex gap-4">
        {article.image && (
          <Media
            src={article.image}
            ratio="square"
            className="w-20 shrink-0"
            onFail={() => setBroken(true)}
          />
        )}
        <div className="min-w-0">
          <h3 className="font-body font-semibold text-small leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {article.headline}
          </h3>
          <div className="mt-2">
            <Meta article={article} />
          </div>
        </div>
      </Link>
    </article>
  );
}
