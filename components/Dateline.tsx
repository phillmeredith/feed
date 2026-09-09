"use client";

import { useEffect, useState } from "react";
import { SITE_TIME_ZONE } from "@/lib/format";

/*
 * The time and nothing else.
 *
 * This used to carry the weekday and the date as well, which put the day on
 * the page twice — once here and once in the masthead line below, three
 * centimetres apart and in two different formats. The masthead says which
 * day's paper this is; this says how long ago it was set.
 */
function stampFor(date: Date) {
  return date.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SITE_TIME_ZONE,
  });
}

/**
 * The dateline is the one thing a reader checks to decide whether the page is
 * live, and server-rendered it froze at the instant of the render — a page left
 * open all morning still showed the minute it was opened.
 *
 * It starts from the server's own stamp so the first paint and hydration agree,
 * then follows the clock from there. Half a minute is fine for a display that
 * only shows minutes; anything faster is wasted renders.
 */
export function Dateline({ since }: { since: string }) {
  const [stamp, setStamp] = useState(() => stampFor(new Date(since)));

  useEffect(() => {
    const tick = () => setStamp(stampFor(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="kicker text-micro text-faint">Updated {stamp}</span>;
}
