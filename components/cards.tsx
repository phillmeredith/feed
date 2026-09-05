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
    <p className="kicker text-[9px] text-faint">
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
            <p className="kicker text-[11px] text-accent">{desk?.label}</p>
            <h2 className="headline mt-4 text-[clamp(2rem,4.2vw,3.5rem)] group-hover:text-accent transition-colors">
              {article.headline}
            </h2>
            {article.dek && (
              <p className="mt-5 text-[17px] leading-relaxed text-muted max-w-xl">
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
          className={`headline text-[21px] line-clamp-2 group-hover:text-accent transition-colors ${
            article.image ? "mt-4" : ""
          }`}
        >
          {article.headline}
        </h3>
        {article.dek && (
          <p className="mt-3 text-[15px] leading-relaxed text-muted line-clamp-3">
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
        <h3 className="font-body font-semibold text-[17px] leading-snug truncate group-hover:text-accent transition-colors">
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
          <h3 className="font-body font-semibold text-[15px] leading-snug line-clamp-2 group-hover:text-accent transition-colors">
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
