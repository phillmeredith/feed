"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Results, kept out of sight until asked for.
 *
 * The sport desks put podiums, winners and finishes on the page the moment
 * they exist, which is right for someone watching live and ruins the page for
 * anyone who recorded it. A results page is not much use if opening it costs
 * you the race.
 *
 * A native <details> does the work: the content is present for search and for
 * a reader with no JavaScript, but nothing is painted and the summary is
 * keyboard-operable for free. The preference below opens them all at once for
 * anyone who has already watched.
 *
 * The honest limit: the figures are in the page source. This stops them being
 * seen, not from being findable by someone determined to look.
 */
const KEY = "dispatch:spoilers";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "show";
  } catch {
    // Private windows and blocked storage: default to protecting the reader.
    return false;
  }
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSpoilers() {
  const show = useSyncExternalStore(subscribe, read, () => false);

  const set = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(KEY, next ? "show" : "hide");
    } catch {
      // Nothing to persist to; the toggle still works for this page.
    }
    listeners.forEach((notify) => notify());
  }, []);

  return [show, set] as const;
}

/** The site-wide switch, at the top of a sport page. */
export function SpoilerToggle() {
  const [show, set] = useSpoilers();

  return (
    <button
      type="button"
      onClick={() => set(!show)}
      aria-pressed={show}
      className="kicker text-[10px] text-muted hover:text-accent transition-colors border-b border-rule pb-1"
    >
      Results {show ? "showing" : "hidden"}
      <span className="text-faint"> · {show ? "hide" : "show"} them</span>
    </button>
  );
}

/**
 * One result, blurred rather than folded away.
 *
 * This was a disclosure per result, which is safe but tiring: every round of
 * the season grew its own "Show result →", and a page of those is a page of
 * near-identical grey links that says nothing about what is behind any of
 * them. Blurring keeps the shape of the page — you can see there is a podium
 * and how long the classification runs — while the names stay unreadable, and
 * the one switch at the top brings the lot back at once.
 *
 * `label` is what the mask is standing in for, said to assistive technology in
 * place of the text: a blurred name still read aloud is not hidden at all.
 *
 * The honest limit, as before: this stops the result being seen. It does not
 * stop it being found by someone reading the page source.
 */
export function SpoilerGuard({
  label = "Result",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [show] = useSpoilers();

  if (show) return <>{children}</>;

  return (
    <span className="relative inline-block align-top max-w-full">
      <span
        aria-hidden="true"
        className="block blur-[5px] select-none opacity-70 pointer-events-none"
        /* Blur alone leaves short words guessable by their shape, so the
           tracking is opened up as well. */
        style={{ letterSpacing: "0.06em" }}
      >
        {children}
      </span>
      <span className="sr-only">
        {label} hidden. Turn results on to read it.
      </span>
    </span>
  );
}
