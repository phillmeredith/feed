"use client";

import { useSyncExternalStore } from "react";
import { relativeDate } from "@/lib/format";

/*
 * One clock for the whole page.
 *
 * Every card carries a timestamp and a page holds dozens, so a timer per card
 * would mean fifty of them ticking out of step — and fifty cards disagreeing
 * about when "an hour ago" starts. A single module-level ticker keeps them
 * consistent and costs one timer, started with the first subscriber and
 * stopped with the last.
 */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    // Catch up immediately: the module may have loaded well before mount.
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;

/*
 * The server has no ticker, so it reports a sentinel and formats against its
 * own clock. React uses the same path for the hydrating render, which keeps
 * the two in step; the live clock takes over on the render straight after.
 */
const getServerSnapshot = () => 0;

/** Renders "2h ago" and keeps it true without a reload. */
export function RelativeTime({ iso }: { iso: string }) {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <span suppressHydrationWarning>
      {tick === 0 ? relativeDate(iso) : relativeDate(iso, tick)}
    </span>
  );
}
