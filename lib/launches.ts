import store from "../data/launches.json" with { type: "json" };

/**
 * The launch schedule, from The Space Devs' Launch Library.
 *
 * Keyless, accurate to the second where the provider has confirmed a T-0, and
 * honest about it where they haven't — the precision field says whether a date
 * means a second, a day or a quarter, which is the part every other launch
 * calendar throws away.
 */
export interface Launch {
  id: string;
  name: string;
  mission: string;
  missionType: string;
  provider: string;
  rocket: string;
  pad: string;
  location: string;
  /** No Earlier Than: the scheduled instant. */
  net: string;
  /** "Second", "Day", "Month" — how much of `net` to believe. */
  precision: string;
  status: string;
  statusNote: string;
  image?: string;
}

interface Store {
  updated: string;
  items: Launch[];
}

const STORE = store as Store;

export function launches(): Launch[] {
  return STORE.items;
}

export function launchesUpdated(): string {
  return STORE.updated;
}

/** Only what is still ahead of us, soonest first. */
export function upcoming(now = new Date()): Launch[] {
  return STORE.items
    .filter((l) => new Date(l.net) > now)
    .sort((a, b) => a.net.localeCompare(b.net));
}

export function nextLaunch(now = new Date()): Launch | null {
  return upcoming(now)[0] ?? null;
}

/**
 * How firmly a date is being given.
 *
 * A launch "in Q4" and a launch at 16:15:03 are both a row in a table, and
 * printing them the same way is a small lie the reader has no way to catch.
 */
export function precisionNote(precision: string): string | null {
  const p = precision.toLowerCase();
  if (p.includes("second") || p.includes("minute")) return null;
  if (p.includes("hour")) return "to the hour";
  if (p.includes("day")) return "date only";
  if (p.includes("week")) return "that week";
  if (p.includes("month")) return "that month";
  if (p.includes("quarter")) return "that quarter";
  if (p.includes("year")) return "that year";
  return "approximate";
}

/** Providers with the most launches on the books. */
export function providers(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of upcoming()) {
    counts.set(l.provider, (counts.get(l.provider) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
