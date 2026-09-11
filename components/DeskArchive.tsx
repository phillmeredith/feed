"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { RelativeTime } from "./RelativeTime";
import { useReading } from "./Reading";

/**
 * A desk's morgue.
 *
 * Two kinds of story end up here, and the page does not much care which is
 * which: the ones that fell past the desk's second page because newer ones
 * arrived, and the ones the reader marked read, however new they are. Both are
 * the same statement — this is not what the desk is showing me now — so both
 * are on the same shelf, with only a small word to say which happened.
 *
 * It is a list and it is meant to be. A morgue is read by scanning down a
 * month for something half-remembered, which is what a ruled column of dates
 * and headlines is for; pictures would make it a second desk.
 */
export function DeskArchive({
  filed,
  live,
  deskHref,
}: {
  /** Stories that have fallen past the desk's last page. */
  filed: Article[];
  /** Stories still on the desk — here only once the reader files them. */
  live: Article[];
  deskHref: string;
}) {
  const { ready, read, unmark } = useReading();

  const { rows, byRead } = useMemo(() => {
    const marked = ready ? live.filter((a) => read.has(a.id)) : [];
    const rows = [...filed, ...marked].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    return { rows, byRead: marked.length };
  }, [filed, live, read, ready]);

  if (rows.length === 0) {
    return (
      <p className="mt-12 standfirst font-serif text-xl italic">
        Nothing filed yet. Stories arrive here when they fall past the desk&apos;s
        last page, or the moment you mark one read — the tick on any card on{" "}
        <Link href={deskHref} className="text-accent hover:underline">
          the desk
        </Link>
        .
      </p>
    );
  }

  // Months, because that is the unit anyone searching a morgue thinks in.
  const months: { label: string; articles: Article[] }[] = [];
  for (const article of rows) {
    const label = new Date(article.publishedAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const last = months[months.length - 1];
    if (last?.label === label) last.articles.push(article);
    else months.push({ label, articles: [article] });
  }

  return (
    <>
      <p className="source mt-8">
        {rows.length === 1 ? "One story filed" : `${rows.length} stories filed`}
        {byRead > 0 &&
          (byRead === 1
            ? " · one of them because you read it"
            : ` · ${byRead} of them because you read them`)}
      </p>

      <div className="mt-10 flex flex-col gap-12">
        {months.map((month) => (
          <section key={month.label}>
            <h2 className="kicker border-b-2 border-ink pb-2.5 text-micro tracking-[0.22em]">
              {month.label}
            </h2>

            <div className="ruled grid grid-cols-1 items-start pt-1 sm:grid-cols-2 2xl:grid-cols-3">
              {month.articles.map((article) => (
                <article
                  key={article.id}
                  className="group border-b border-rule py-3.5"
                >
                  <Link href={`/story/${article.id}`} className="story block">
                    <h3 className="headline text-[1.15rem] font-medium leading-[1.2]">
                      {article.headline}
                    </h3>
                  </Link>
                  <p className="source mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <span>
                      <b>{article.source}</b> ·{" "}
                      <RelativeTime iso={article.publishedAt} />
                    </span>
                    {/*
                      * The way back out, and only on the stories that got here
                      * by being read — a story the desk itself filed cannot be
                      * unfiled, because what put it here was the calendar.
                      */}
                    {ready && read.has(article.id) && (
                      <button
                        type="button"
                        onClick={() => unmark(article.id)}
                        className="text-accent transition-colors hover:underline"
                      >
                        Read · put back
                      </button>
                    )}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
