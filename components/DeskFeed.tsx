"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";
import { StackedLead } from "./cards";
import { Gallery, Split, Index, SectionBlock } from "./shapes";
import { BandHead, RailHead } from "./Band";
import { RelativeTime } from "./RelativeTime";
import { useReading } from "./Reading";

/**
 * A desk's reporting, laid out and with the read stories taken out of it.
 *
 * This is the part of a desk page that depends on who is looking at it, so it
 * is the part that runs in the browser. The server sends the page's own
 * stories and a reserve drawn from the page behind it; anything marked read
 * drops out and the reserve closes the gap, so filing a story away leaves a
 * desk full rather than gap-toothed.
 *
 * The shapes are the ones the fronts use — a lead with a rail beside it, three
 * across, one picture with the reporting beside it, then headlines — and they
 * are dealt after the filtering rather than before it, which is the whole
 * point: promote a story out of the tail and it arrives with a picture,
 * instead of leaving the desk's opener blank.
 */
export function DeskFeed({
  articles,
  show,
  label,
  slug,
  total,
  mode = "full",
}: {
  /** The page's stories, followed by the reserve behind them. */
  articles: Article[];
  /** How many of them the page has room for. */
  show: number;
  label: string;
  slug: string;
  total: number;
  /**
   * "brief" is a desk whose own Articles tab holds the reporting — the sport
   * desks — and only wants a taste of it above the fixtures.
   */
  mode?: "full" | "brief";
}) {
  const { ready, read } = useReading();

  /*
   * Unread first, and the read ones only if that leaves the page short — a
   * desk read to the bottom should still be a desk rather than an apology.
   */
  const unread = ready ? articles.filter((a) => !read.has(a.id)) : articles;
  const page = (unread.length > 0 ? unread : articles).slice(0, show);

  if (mode === "brief") {
    return (
      <div className="mt-12">
        <SectionBlock
          title="Latest"
          dek="The reporting, in brief"
          href={`/${slug}/articles`}
          total={total}
          articles={page.slice(0, 6)}
          shape="index"
        />
      </div>
    );
  }

  if (page.length === 0) {
    return (
      <p className="mt-12 standfirst font-serif text-xl italic">
        Nothing new on this desk right now. Check back after the next refresh,
        or read what has already been filed in{" "}
        <Link href={`/${slug}/archive`} className="text-accent hover:underline">
          the archive
        </Link>
        .
      </p>
    );
  }

  const [lead, ...rest] = page;
  const rail = rest.slice(0, 5);
  const afterRail = rest.slice(5);
  const gallery = afterRail.filter((a) => a.image).slice(0, 3);
  const afterGallery = afterRail.filter((a) => !gallery.includes(a));
  const split = afterGallery.slice(0, 4);
  const remainder = afterGallery.slice(4);

  return (
    <>
      {/*
        * A desk opener, not a front-page lead. `LeadCard` sets its headline at
        * the one size nothing outside the front page is allowed to use.
        *
        * The rail matters for more than variety. Without it the lead's picture
        * ran the width of the sheet — 16:9 across 1350px is seven hundred and
        * fifty pixels of photograph before a headline — and the page opened on
        * a wall.
        */}
      <div className="mt-12 grid gap-x-gutter gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StackedLead article={lead} />

        {rail.length > 0 && (
          <aside className="border-t border-rule-strong pt-6 lg:border-t-0 lg:pt-0 lg:rule-l">
            <RailHead>Also on this desk</RailHead>
            <ol>
              {rail.map((article) => (
                <li
                  key={article.id}
                  className="group border-b border-rule py-4 last:border-b-0"
                >
                  <Link href={`/story/${article.id}`} className="story block">
                    <h3 className="headline text-[1.2rem] font-medium leading-[1.18]">
                      {article.headline}
                    </h3>
                    <p className="source mt-2">
                      {article.source} ·{" "}
                      <RelativeTime iso={article.publishedAt} />
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      {gallery.length > 0 && (
        <div className="mt-14 border-t border-rule-strong pt-10">
          <Gallery articles={gallery} />
        </div>
      )}

      {split.length > 0 && (
        <div className="mt-14 border-t border-rule-strong pt-10">
          <Split articles={split} />
        </div>
      )}

      {remainder.length > 0 && (
        <div className="mt-14">
          <BandHead
            weight="major"
            title="The rest of the desk"
            note={`Everything else ${label.toLowerCase()} has filed.`}
          />
          <Index articles={remainder} limit={remainder.length} />
        </div>
      )}
    </>
  );
}
