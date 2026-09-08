"use client";

import { useEffect, useRef } from "react";

/**
 * Scrolls a nav's current item into view when the row is too narrow to show it.
 *
 * A scrolling nav solves the wrapping problem and introduces a smaller one:
 * the desks are alphabetical, not centred on you, so landing on the UFC put
 * the marked item entirely off the right edge — a nav that doesn't show where
 * you are is worse than one that wraps badly. This nudges the row so the
 * current item is visible, and does nothing at all when it already is, which
 * is every desktop width.
 *
 * `scrollLeft` rather than `scrollIntoView`, because the latter will also
 * scroll the page vertically to reach a horizontal target.
 */
export function KeepCurrentInView() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nav = anchor.current?.closest("nav");
    if (!nav) return;

    const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    if (nav.scrollWidth <= nav.clientWidth) return;

    const navBox = nav.getBoundingClientRect();
    const itemBox = current.getBoundingClientRect();
    const visible =
      itemBox.left >= navBox.left && itemBox.right <= navBox.right;
    if (visible) return;

    // Centre it where there's room, and the browser clamps at either end.
    nav.scrollLeft +=
      itemBox.left - navBox.left - (navBox.width - itemBox.width) / 2;
  }, []);

  return <span ref={anchor} aria-hidden="true" className="sr-only" />;
}
