"use client";

import { Children } from "react";
import { useReading } from "./Reading";

/**
 * A run of slots, and a bench of reserves to fill them from.
 *
 * The front page is cached HTML served to everyone, so it cannot know what any
 * one reader has read. What it can do is send more stories than it has room
 * for: every group of slots on the sheet — the lead, the wire rail, a column
 * of the briefs band — is drawn with two or three spares behind it, all of
 * them rendered, none of them otherwise used anywhere on the page.
 *
 * This shows the first `show` of them the reader hasn't marked read. Mark the
 * lead and the reserve behind it moves up; mark that and the next one does.
 * Read the bench dry and the page shows its original pick rather than a hole,
 * because a front page with gaps in it is worse than a front page you have
 * already seen.
 *
 * The picks keep the server's order, which is the editorial order — promotion
 * closes a gap, it doesn't reshuffle the page.
 *
 * `ids` must be the same articles, in the same order, as `children`.
 */
export function Slots({
  ids,
  show,
  children,
}: {
  ids: string[];
  show: number;
  children: React.ReactNode;
}) {
  const { ready, read } = useReading();
  const rendered = Children.toArray(children);

  // Before the browser's record has been read, the server's pick stands.
  if (!ready) return <>{rendered.slice(0, show)}</>;

  const picked: number[] = [];
  for (let i = 0; i < rendered.length && picked.length < show; i += 1) {
    if (!read.has(ids[i])) picked.push(i);
  }
  // Nothing left unread: fall back to the top of the group in its own order.
  for (let i = 0; i < rendered.length && picked.length < show; i += 1) {
    if (!picked.includes(i)) picked.push(i);
  }

  return <>{picked.sort((a, b) => a - b).map((i) => rendered[i])}</>;
}
