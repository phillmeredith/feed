"use client";

import type { Article } from "@/lib/types";
import { isResultSpoiler } from "@/lib/spoilers";
import { useSpoilers } from "./SpoilerGuard";

/**
 * A headline that gives the result away, kept unreadable until asked for.
 *
 * The structured results were guarded and then the desk underneath them ran
 * "Russell beats Leclerc to top spot", which undoes the whole exercise. This
 * masks only the headlines that actually carry a result — see lib/spoilers,
 * which requires both a result-shaped verb and the name of somebody who
 * recently won — so the reporting that spoils nothing stays readable.
 *
 * The blur is decorative and hidden from assistive technology; the real text
 * is replaced for screen readers by a line saying why, because a blurred
 * headline still read aloud is not hidden at all. Both come back together on
 * the one switch at the top of the desk.
 */
export function SpoilerHeadline({ article }: { article: Article }) {
  const [show] = useSpoilers();

  if (show || !isResultSpoiler(article)) return <>{article.headline}</>;

  return (
    <>
      <span
        aria-hidden="true"
        className="blur-[5px] select-none opacity-70"
        /* `blur` alone leaves the shape of the words legible at a glance, so
           the text is also stretched out of its natural rhythm. */
        style={{ letterSpacing: "0.06em" }}
      >
        {article.headline}
      </span>
      <span className="sr-only">
        Headline hidden because it gives away a result. Turn results on to read
        it.
      </span>
    </>
  );
}
