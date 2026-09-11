"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

/*
 * What the reader has already read.
 *
 * There is no account and no database here — the site is forty RSS feeds and a
 * cache — so this is the reader's own record, kept in their browser and never
 * sent anywhere. It is the one piece of state on the site that belongs to a
 * person rather than to the paper.
 *
 * Filing a story sends it there by hand: it leaves the desk and the front page
 * and turns up in the desk's archive instead, whatever its age. That is the
 * same move the desk makes on its own when a story falls past the second page
 * — one shelf, reached two ways.
 *
 * There is one control, and it is on a story's own page. A tick in the corner
 * of every card came first and is gone: a filing cabinet does not put a handle
 * on every sheet of paper, and forty of them down a front page made the sheet
 * read as an inbox. You file a story from the story.
 *
 * The pages themselves are cached HTML shared by everyone, so none of this can
 * happen on the server. What the server sends is its own best pick plus a few
 * reserves; the filtering happens here, after hydration, which is why every
 * consumer has to cope with `ready` being false for a frame.
 *
 * localStorage is an external store and this is written as one — a module-level
 * record, a set of listeners and `useSyncExternalStore` — rather than as state
 * loaded by an effect. That is not ceremony: `useSyncExternalStore` is the one
 * hook that knows the server rendered something different on purpose, so it
 * hydrates against the server's markup and then swaps, instead of tripping a
 * mismatch. It also means there is nothing to mount at the root of the app.
 */

const KEY = "dispatch:read.v1";

/**
 * How many stories the record holds before the oldest marks are dropped.
 *
 * A mark is an id and a timestamp — forty bytes — so this is a couple of
 * hundred kilobytes at worst, and localStorage gives a page five megabytes.
 * The cap is not about space; it is about a record that has to be parsed on
 * every page load staying a record rather than becoming a log.
 */
const CAP = 5000;

type Marks = Record<string, number>;

function read(): Marks {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const marks: Marks = {};
    for (const [id, at] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof at === "number") marks[id] = at;
    }
    return marks;
  } catch {
    // A full disk, a private window, a reader who cleared the site's storage
    // mid-session: none of them should take the page down with them.
    return {};
  }
}

/** Drops the oldest marks once the record is over the cap. */
function capped(marks: Marks): Marks {
  const ids = Object.keys(marks);
  if (ids.length <= CAP) return marks;

  const kept: Marks = {};
  for (const id of ids.sort((a, b) => marks[b] - marks[a]).slice(0, CAP)) {
    kept[id] = marks[id];
  }
  return kept;
}

/*
 * The store. `null` means the browser's record has not been read yet, which is
 * also what every render on the server sees — the two states are the same
 * state, and everything downstream treats it as "the paper's own pick stands".
 */
let marks: Marks | null = null;
const listeners = new Set<() => void>();

/**
 * The record as it stands, reading it off the browser the first time it is
 * asked for.
 *
 * Every write goes through this rather than through `marks` directly, and that
 * is not tidiness. `marks` is null until something asks for it, and what asks
 * for it is React's own check of the store — which runs *after* hydration.
 * A reader who clicked Archive in that window had their click applied to an
 * empty record, and the write that followed replaced everything they had ever
 * filed with that one story.
 */
function loaded(): Marks {
  if (marks === null) marks = read();
  return marks;
}

function snapshot(): Marks | null {
  return loaded();
}

/** On the server there is no record, and there never will be one. */
function serverSnapshot(): Marks | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: Marks) {
  marks = capped(next);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(marks));
  } catch {
    /* Nothing to do about it, and nothing worth saying to the reader. */
  }
  for (const listener of listeners) listener();
}

// Two tabs of the same paper should agree about what has been read.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    marks = read();
    for (const listener of listeners) listener();
  });
}

function without(current: Marks, id: string): Marks {
  const next = { ...current };
  delete next[id];
  return next;
}

interface Reading {
  /**
   * Whether the browser's record has been read yet.
   *
   * False on the server and for the hydrating render. Anything that changes
   * what is on the page must wait for it — acting on an empty record would
   * blank every read story out of the page and then put it back.
   */
  ready: boolean;
  /** Ids the reader has marked, in no order. */
  read: ReadonlySet<string>;
  isRead: (id: string) => boolean;
  mark: (id: string) => void;
  unmark: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

const EMPTY: ReadonlySet<string> = new Set();

/**
 * One Set per version of the record rather than one per render — there are a
 * hundred cards on a front page and every one of them asks for this.
 */
let cachedIds: { source: Marks | null; value: ReadonlySet<string> } = {
  source: null,
  value: EMPTY,
};

function idsOf(current: Marks | null): ReadonlySet<string> {
  if (current === null) return EMPTY;
  if (cachedIds.source !== current) {
    cachedIds = { source: current, value: new Set(Object.keys(current)) };
  }
  return cachedIds.value;
}

export function useReading(): Reading {
  const current = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  /*
   * A fresh Set per render would be a new identity every time, which matters
   * for the memos downstream; keyed on the record itself, it is one Set per
   * change to the record.
   */
  const ids = idsOf(current);

  const mark = useCallback((id: string) => {
    const now = loaded();
    if (!now[id]) publish({ ...now, [id]: Date.now() });
  }, []);

  const unmark = useCallback((id: string) => {
    const now = loaded();
    if (now[id]) publish(without(now, id));
  }, []);

  const toggle = useCallback((id: string) => {
    const now = loaded();
    publish(now[id] ? without(now, id) : { ...now, [id]: Date.now() });
  }, []);

  const clear = useCallback(() => publish({}), []);

  return {
    ready: current !== null,
    read: ids,
    isRead: (id) => ids.has(id),
    mark,
    unmark,
    toggle,
    clear,
  };
}


/**
 * The story page's own control, beside the headline.
 *
 * Labelled rather than a bare tick. The mark on a card can be a glyph because
 * there are forty of them on a page and the reader is scanning; there is one
 * article on this page, the control belongs to it, and a word says what it
 * does without anyone having to hover it to find out.
 *
 * Opening a story used to file it automatically, on the argument that reading
 * something is the plainest statement there is that you have read it. It made
 * this button a permanent "put back" — a control whose only state was undo —
 * and it took the decision out of the reader's hands, which is the opposite of
 * what filing by hand is for. Archiving is a thing you do now, not a thing
 * that happens to you.
 */
export function ArchiveThis({ id }: { id: string }) {
  const { ready, isRead, toggle } = useReading();
  const archived = ready && isRead(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={archived}
      /* Ink on hover, and oxide once it is filed — the same two moves the
         mark on a card makes, in the meta face the rest of the site's small
         controls are set in. */
      className={`kicker shrink-0 whitespace-nowrap rounded-full border bg-[var(--paper)] px-3.5 py-2 text-micro tracking-[0.17em] transition-colors
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]
        ${
          archived
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-[var(--rule-strong)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
        }`}
    >
      {archived ? "Archived · put back" : "Archive this"}
    </button>
  );
}

/**
 * The folio's line about the record: how much of it there is, and the way out.
 *
 * Any state a site keeps about a person should be visible to them and
 * erasable by them on the same line, and the foot of the page is where a
 * paper puts the things that are true of the whole paper.
 */
export function ReadingTally() {
  const { ready, read, clear } = useReading();
  const [confirming, setConfirming] = useState(false);

  if (!ready || read.size === 0) return null;

  return (
    <span>
      {read.size === 1 ? "One story filed" : `${read.size} stories filed`} ·{" "}
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => {
              clear();
              setConfirming(false);
            }}
            className="text-accent transition-colors hover:underline"
          >
            Clear the record
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="transition-colors hover:text-ink"
          >
            keep it
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="transition-colors hover:text-accent"
        >
          clear
        </button>
      )}
    </span>
  );
}
