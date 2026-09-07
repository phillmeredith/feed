"use client";

import { useSyncExternalStore, useState, useCallback } from "react";

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
 * One result, behind a disclosure.
 *
 * `label` says what is being withheld without giving it away — "Result" and
 * not "Norris wins" — because a spoiler guard that names the winner in its
 * own summary has done nothing at all.
 */
export function SpoilerGuard({
  label = "Result",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [show] = useSpoilers();
  const [openedHere, setOpenedHere] = useState(false);
  const open = show || openedHere;

  return (
    <details
      className="group"
      open={open}
      onToggle={(event) => setOpenedHere(event.currentTarget.open)}
    >
      <summary className="kicker text-[9px] text-muted hover:text-accent cursor-pointer list-none inline-block">
        <span className="group-open:hidden">Show {label.toLowerCase()} →</span>
        <span className="hidden group-open:inline">
          Hide {label.toLowerCase()} ↑
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
