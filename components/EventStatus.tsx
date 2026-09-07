import { sportDate, sportTime, hasPassed, isStale } from "@/lib/format";

/**
 * Where an event is in its life, said out loud.
 *
 * Every time-sensitive thing on these desks has five states — not announced,
 * scheduled, live, finished, and finished with the highlights not up yet —
 * and the pages had a word for two of them. A card with no bill read as an
 * empty card; an event mid-session read as one that hadn't started.
 */
export type EventState =
  | "unannounced"
  | "scheduled"
  | "live"
  | "finished"
  | "awaiting-highlights";

export const STATE_LABEL: Record<EventState, string> = {
  unannounced: "Not announced",
  scheduled: "Scheduled",
  live: "Under way",
  finished: "Finished",
  "awaiting-highlights": "Highlights to come",
};

/**
 * An event is live from its start until a generous end, because none of these
 * sources say "in progress" reliably and a Grand Prix, a four-round major and
 * a fight card all end at different distances from their start time.
 */
export function stateFor({
  startsAt,
  endsAt,
  finished,
  hasCard,
  hasHighlights,
  now = Date.now(),
}: {
  startsAt: string;
  endsAt?: string;
  finished: boolean;
  hasCard?: boolean;
  hasHighlights?: boolean;
  now?: number;
}): EventState {
  if (finished) {
    return hasHighlights === false ? "awaiting-highlights" : "finished";
  }
  const started = hasPassed(startsAt, now);
  if (started) {
    const over = endsAt ? hasPassed(endsAt, now) : false;
    if (!over) return "live";
    return "finished";
  }
  if (hasCard === false) return "unannounced";
  return "scheduled";
}

/** The line that says when, in the reader's own time, with the zone named. */
export function WhenLine({
  at,
  state,
  place,
}: {
  at: string;
  state: EventState;
  place?: string;
}) {
  return (
    <p className="kicker text-[9px] text-faint">
      {state === "live" && <span className="text-accent">Under way · </span>}
      {sportDate(at, { weekday: "short", day: "numeric", month: "short" })}
      <span className="mx-2 text-rule">/</span>
      {sportTime(at)}
      {place && (
        <>
          <span className="mx-2 text-rule">/</span>
          {place}
        </>
      )}
    </p>
  );
}

/** A stamp saying when the numbers were last pulled, and from where. */
export function LastUpdated({
  at,
  source,
}: {
  at: string | null;
  source: string;
}) {
  if (!at) {
    return (
      <p className="kicker text-[9px] text-faint">
        {source} · never fetched
      </p>
    );
  }

  // Reading the clock lives in lib, so this component stays pure.
  const stale = isStale(at);

  return (
    <p className="kicker text-[9px] text-faint">
      {source} · updated{" "}
      {sportDate(at, { day: "numeric", month: "short" })} {sportTime(at)}
      {/* Said in words, not by colour, so it survives a greyscale screen. */}
      {stale && <span className="text-negative"> · may be out of date</span>}
    </p>
  );
}
