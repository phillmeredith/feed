import store from "../data/golf.json" with { type: "json" };

/**
 * Golf, from ESPN's public scoreboard.
 *
 * There is no Jolpica for golf — no free, complete, licensable results
 * archive. What there is is the scoreboard ESPN's own site reads: keyless,
 * stable, and carrying the full field rather than a top ten. It is read by a
 * scheduled script into data/golf.json, like the F1 season, so the page costs
 * a render and not a round trip.
 */
export interface GolfPlayer {
  position: number;
  name: string;
  /** To par, as golf writes it: "-10", "E", "+3". */
  score: string;
  country?: string;
}

export interface GolfEvent {
  id: string;
  name: string;
  /** The four that decide a career, marked so the page can lead with them. */
  major: boolean;
  startDate: string;
  endDate: string;
  status: string;
  venue?: string;
  purse?: string;
  winner?: string;
  leaderboard: GolfPlayer[];
}

interface Store {
  season: string;
  updated: string | null;
  events: GolfEvent[];
}

const SEASON = store as unknown as Store;

/** The four majors, by the names ESPN files them under. */
export const MAJORS = [
  "Masters Tournament",
  "PGA Championship",
  "U.S. Open",
  "The Open",
];

export function golfSeason(): Store {
  return SEASON;
}

/** Everything played, newest first. */
export function playedEvents(): GolfEvent[] {
  return SEASON.events
    .filter((e) => e.status === "Final")
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

export function majors(): GolfEvent[] {
  return playedEvents().filter((e) => e.major);
}

/** The event a golf page should open on: the last major, else the last event. */
export function latestEvent(): GolfEvent | null {
  return majors()[0] ?? playedEvents()[0] ?? null;
}

export function golfEventById(id: string): GolfEvent | null {
  return SEASON.events.find((e) => e.id === id) ?? null;
}
