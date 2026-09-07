import type { EventState } from "../EventStatus";

/**
 * What state a thing is in, said in a word and a colour rather than a colour.
 *
 * The sport desks were distinguishing scheduled from finished with
 * `text-accent` against `text-faint`, which is two shades of the same
 * decision and unreadable to anyone who cannot separate them. There are
 * colours for these states now, and the word is always there regardless.
 */
const TONE: Record<EventState, string> = {
  unannounced: "text-settled",
  scheduled: "text-scheduled",
  live: "text-live",
  finished: "text-settled",
  "awaiting-highlights": "text-caution",
};

const LABEL: Record<EventState, string> = {
  unannounced: "Not announced",
  scheduled: "Scheduled",
  live: "Under way",
  finished: "Finished",
  "awaiting-highlights": "Highlights to come",
};

export function StateBadge({ state }: { state: EventState }) {
  return (
    <span className={`kicker text-label ${TONE[state]}`}>
      {/* A dot for the one state that is happening now, and a word for all
          of them — the dot is decoration, the word is the information. */}
      {state === "live" && (
        <span aria-hidden="true" className="mr-2">
          ●
        </span>
      )}
      {LABEL[state]}
    </span>
  );
}
