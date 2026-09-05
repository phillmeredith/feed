import store from "../data/highlights.json" with { type: "json" };

/**
 * Official highlights, found rather than fetched.
 *
 * Every sport this desk covers puts its own highlights on YouTube, under
 * titles that barely vary — "Race Highlights | 2026 Dutch Grand Prix",
 * "Final Round Highlights | The Open". Nothing about that needs an API key;
 * it needs knowing which channel is the rights holder and which title shape
 * to trust, both of which are written down here rather than guessed at.
 *
 * Resolved by a scheduled script into data/highlights.json. The pages read
 * the store, so a session that has no highlights simply doesn't offer any.
 */
export type HighlightKind =
  | "race"
  | "qualifying"
  | "sprint"
  | "sprint-qualifying"
  | "final-round"
  | "event";

export interface Highlight {
  /** Which session this belongs to, e.g. "f1:2026:12" or "golf:401811957". */
  key: string;
  kind: HighlightKind;
  videoId: string;
  title: string;
  channel: string;
}

const ITEMS = store.items as Highlight[];

const byKey = new Map<string, Highlight[]>();
for (const item of ITEMS) {
  const list = byKey.get(item.key) ?? [];
  list.push(item);
  byKey.set(item.key, list);
}

/** Session order, so a page lays them out the way a weekend runs. */
const ORDER: HighlightKind[] = [
  "race",
  "final-round",
  "event",
  "sprint",
  "qualifying",
  "sprint-qualifying",
];

export function highlightsFor(key: string): Highlight[] {
  return [...(byKey.get(key) ?? [])].sort(
    (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind)
  );
}

export function f1Key(season: string | number, round: number) {
  return `f1:${season}:${round}`;
}

export function golfKey(eventId: string) {
  return `golf:${eventId}`;
}

export const KIND_LABELS: Record<HighlightKind, string> = {
  race: "Race highlights",
  qualifying: "Qualifying highlights",
  sprint: "Sprint highlights",
  "sprint-qualifying": "Sprint qualifying",
  "final-round": "Final round highlights",
  event: "Highlights",
};

export function highlightCount() {
  return ITEMS.length;
}
