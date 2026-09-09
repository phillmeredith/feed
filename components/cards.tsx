"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";
import { relativeDate } from "@/lib/format";

export { relativeDate };
import { Media, Plate } from "./Media";
import { RelativeTime } from "./RelativeTime";

/*
 * A dead image drops the picture, not the story.
 *
 * Every card below used to unmount itself when its artwork failed, which is
 * defensible in a free-flowing grid of image-led cards and indefensible in
 * this one: the page is ruled columns now, and a card that removes itself
 * leaves a hole with a rule down both sides of it. Publishers move JPEGs
 * constantly — one of them should not be able to blank a column of the paper.
 * The headline is the content; the artwork is decoration, and every card here
 * already has a layout for arriving without one.
 */

/**
 * The line above a headline. Oxide by default — it is the only colour on the
 * page and this is what it is for — or muted where a run of them would turn a
 * column red.
 */
export function Kicker({
  article,
  mute = false,
  className = "",
}: {
  article: Article;
  mute?: boolean;
  className?: string;
}) {
  const desk = categoryBySlug(article.category);
  if (!desk) return null;

  return (
    <span
      className={`kicker block text-micro ${
        mute ? "text-faint" : "text-accent"
      } ${className}`}
    >
      {desk.label}
    </span>
  );
}

/**
 * The line below one: who filed it, and when. Set in the meta face with the
 * outlet in the heavier weight, because the outlet is the part a reader is
 * actually deciding on.
 */
export function Meta({
  article,
  showDesk = false,
  className = "",
}: {
  article: Article;
  showDesk?: boolean;
  className?: string;
}) {
  const desk = categoryBySlug(article.category);
  return (
    <p className={`source ${className}`}>
      {showDesk && desk && <>{desk.short} · </>}
      <b>{article.source}</b> · <RelativeTime iso={article.publishedAt} />
    </p>
  );
}

/**
 * The lead. One story gets the top of the sheet and the largest type in the
 * paper, and everything else on the page is measured against it.
 *
 * A dead image drops the picture, not the story. The smaller cards remove
 * themselves when their artwork fails, which is defensible in a grid of
 * image-led cards — but this is the lead, and applying the same rule meant a
 * publisher moving a JPEG deleted the front page's main story. It rendered on
 * the server, hydrated, the image 404'd and the whole card unmounted, so the
 * hero appeared for a moment on load and then vanished. The headline is the
 * content; the artwork is decoration, and the no-image layout already exists.
 */
export function LeadCard({ article }: { article: Article }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(article.image) && !imageFailed;

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="story block">
        <Kicker article={article} className="mb-2" />
        <h2 className="headline text-lead">{article.headline}</h2>

        {showImage && (
          <Plate
            src={article.image}
            credit={article.source}
            ratio="hero"
            sizes="(max-width: 1280px) 100vw, 55vw"
            priority
            className="mt-7"
            onFail={() => setImageFailed(true)}
          />
        )}

        {article.dek && (
          /*
           * The drop cap belongs to the standfirst rather than to a body of
           * text, because on a front page the standfirst is the only prose
           * there is — and a page needs one letter somewhere at scale to stop
           * reading as a list.
           */
          <p className="standfirst mt-6 max-w-[36em] text-[1.35rem] leading-[1.46] [&::first-letter]:font-display [&::first-letter]:font-bold [&::first-letter]:float-left [&::first-letter]:text-[4.4rem] [&::first-letter]:leading-[0.76] [&::first-letter]:pr-3 [&::first-letter]:pt-2 [&::first-letter]:text-ink">
            {article.dek}
          </p>
        )}

        <Meta article={article} className="mt-4" />
      </Link>
    </article>
  );
}

/**
 * The workhorse: a picture, a headline under it, and as much reporting as the
 * column has room for. Used anywhere a story is being shown rather than listed.
 */
export function FeatureCard({
  article,
  ratio = "landscape",
  headline = "text-subhead",
  showDek = true,
  showKicker = true,
}: {
  article: Article;
  ratio?: "hero" | "wide" | "landscape" | "standard";
  /** The column decides how loud its own feature is. */
  headline?: string;
  showDek?: boolean;
  /**
   * Off inside a block that already names the desk. A row of three cards
   * under a heading reading HARDWARE, each labelled HARDWARE, is three labels
   * that tell a reader nothing they were not just told.
   */
  showKicker?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="story block">
        {article.image && !broken && (
          <Plate
            src={article.image}
            credit={article.source}
            ratio={ratio}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw"
            className="mb-5"
            onFail={() => setBroken(true)}
          />
        )}
        {showKicker && <Kicker article={article} mute className="mb-2" />}
        <h3 className={`headline ${headline}`}>{article.headline}</h3>
        {showDek && article.dek && (
          <p className="standfirst mt-3 text-small line-clamp-3">{article.dek}</p>
        )}
        <Meta article={article} className="mt-3" />
      </Link>
    </article>
  );
}

/**
 * The opener on a section front or a desk page.
 *
 * The same order as the front page's lead, which is the order that works: the
 * desk, the headline, then the picture, then the reporting. It used to stack
 * the artwork on top — and a 16:9 picture at the head of a column is five
 * hundred pixels of photograph before a word, with the headline arriving
 * underneath it at a third of the size looking like a caption. A picture
 * supports a headline; it does not introduce one.
 *
 * Smaller than the front page's lead in every dimension, because it is the
 * lead of a section rather than of the paper.
 */
export function StackedLead({ article }: { article: Article }) {
  const [broken, setBroken] = useState(false);

  return (
    <article className="group">
      <Link href={`/story/${article.id}`} className="story block">
        <Kicker article={article} className="mb-2" />
        <h2 className="headline text-headline">{article.headline}</h2>

        {article.image && !broken && (
          <Plate
            src={article.image}
            credit={article.source}
            ratio="landscape"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
            className="mt-6"
            onFail={() => setBroken(true)}
          />
        )}

        {article.dek && (
          <p className="standfirst mt-5 max-w-[38em] text-lede">{article.dek}</p>
        )}
        <Meta article={article} className="mt-4" />
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
      <Link href={`/story/${article.id}`} className="story block">
        <h3 className="headline text-[1.3rem] font-medium leading-[1.18] break-words line-clamp-3">
          {article.headline}
        </h3>
        <Meta article={article} showDesk={showDesk} className="mt-2" />
      </Link>
    </article>
  );
}

/** Thumbnail row, used in sidebars. */
export function ThumbCard({
  article,
  showDesk = false,
}: {
  article: Article;
  showDesk?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <article className="group border-t border-rule pt-4">
      <Link href={`/story/${article.id}`} className="story flex gap-4">
        {article.image && !broken && (
          <Media
            src={article.image}
            ratio="square"
            sizes="80px"
            className="w-20 shrink-0"
            onFail={() => setBroken(true)}
          />
        )}
        <div className="min-w-0">
          <h3 className="headline text-lede font-medium leading-snug line-clamp-3">
            {article.headline}
          </h3>
          <Meta article={article} showDesk={showDesk} className="mt-2" />
        </div>
      </Link>
    </article>
  );
}

/**
 * A numbered item in the wire rail. The figure is set in the display face and
 * in oxide — the one place on the page where a number is allowed to be
 * decorative, because it is a running order rather than a measurement.
 */
export function WireItem({ article, n }: { article: Article; n: number }) {
  return (
    <li className="group grid grid-cols-[22px_1fr] gap-3 border-b border-rule py-4 last:border-b-0">
      <span className="font-display text-lg leading-tight text-accent">{n}</span>
      <Link href={`/story/${article.id}`} className="story block">
        <h4 className="headline text-[1.15rem] font-medium leading-[1.22]">
          {article.headline}
        </h4>
        <Meta article={article} className="mt-2 text-micro" />
      </Link>
    </li>
  );
}

/**
 * A brief: the desk it came from, and the headline. The first in each column
 * carries a picture, at the same fixed crop as every other column's, so the
 * band reads as one row of pictures over one row of type rather than five
 * separate stacks.
 */
export function BriefCard({
  article,
  lead = false,
}: {
  article: Article;
  lead?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = lead && Boolean(article.image) && !broken;

  return (
    <article className="group border-b border-rule py-3 last:border-b-0">
      <Link href={`/story/${article.id}`} className="story block">
        {showImage && (
          /* Uncredited for the same reason the run's pictures are: a caption
             that wraps in one column and not the next takes the whole band
             out of register. */
          <Media
            src={article.image}
            ratio="landscape"
            sizes="(max-width: 640px) 100vw, (max-width: 1536px) 33vw, 20vw"
            className="mb-3"
            onFail={() => setBroken(true)}
          />
        )}
        <Kicker article={article} mute className="mb-1.5" />
        <h4 className="headline text-[1.1rem] font-normal leading-[1.22]">
          {article.headline}
        </h4>
      </Link>
    </article>
  );
}

/**
 * An item in the dense run at the foot of the page. The first in a column is
 * `lead` — it carries the column's one picture and the only standfirst in it,
 * which is what stops six columns of headlines reading as a contents page.
 */
export function RunItem({
  article,
  lead = false,
}: {
  article: Article;
  lead?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = lead && Boolean(article.image) && !broken;

  return (
    <article className="group border-b border-rule py-5 first:pt-0 last:border-b-0">
      <Link href={`/story/${article.id}`} className="story block">
        {showImage && (
          /*
           * No credit under this one, unlike every other picture on the page.
           * The outlet is already printed two lines below it, and a caption
           * that wraps to two lines in one column and one in the next would
           * knock six otherwise-aligned columns out of register — which is
           * the whole reason the run's pictures are a fixed 3:2 at the top of
           * every column rather than wherever the story wanted them.
           *
           * The picture goes, the story stays: a column whose lead vanished
           * because a publisher moved a JPEG would leave a hole in the run
           * that the section beside it has no way to fill.
           */
          <Media
            src={article.image}
            ratio="landscape"
            sizes="(max-width: 640px) 100vw, (max-width: 1536px) 33vw, 17vw"
            className="mb-4"
            onFail={() => setBroken(true)}
          />
        )}
        <Kicker article={article} mute className="mb-2" />
        <h4
          className={
            lead
              ? "headline text-[1.7rem] font-semibold leading-[1.05]"
              : "headline text-[1.25rem] font-medium leading-[1.16]"
          }
        >
          {article.headline}
        </h4>
        {lead && article.dek && (
          <p className="standfirst mt-2.5 text-small line-clamp-2">
            {article.dek}
          </p>
        )}
        <Meta article={article} className="mt-2.5" />
      </Link>
    </article>
  );
}
