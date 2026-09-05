import store from "../data/ufc.json" with { type: "json" };

/**
 * The UFC, from ESPN's public scoreboard.
 *
 * Same source as the golf, and the only free one that carries a whole card
 * rather than the main event: every bout, both corners, who won and how.
 * Read by a scheduled script into data/ufc.json.
 */
export interface Fight {
  /** Where on the card this sat: the main card, or the prelims beneath it. */
  segment: "main" | "prelim";
  weightClass: string;
  /** Both corners, in the order ESPN lists them. */
  fighters: string[];
  winner?: string;
  /** How it ended: "KO/TKO", "Submission", "Decision". */
  method?: string;
  rounds?: number;
  /** The main event, and the co-main beneath it. */
  headline: boolean;
  completed: boolean;
}

export interface UfcEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  venue?: string;
  location?: string;
  fights: Fight[];
}

interface Store {
  season: string;
  updated: string | null;
  events: UfcEvent[];
}

const SEASON = store as unknown as Store;

export function ufcSeason(): Store {
  return SEASON;
}

/** Everything that has happened, newest first. */
export function completedEvents(): UfcEvent[] {
  return SEASON.events
    .filter((e) => e.status === "Final")
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The next card, if one is booked. */
export function nextEvent(now = new Date()): UfcEvent | null {
  return (
    SEASON.events
      .filter((e) => e.status !== "Final" && new Date(e.date) >= now)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

export function mainCard(event: UfcEvent): Fight[] {
  return event.fights.filter((f) => f.segment === "main");
}

export function prelims(event: UfcEvent): Fight[] {
  return event.fights.filter((f) => f.segment === "prelim");
}

/** How a result reads, without asserting a clock this source doesn't explain. */
export function resultLine(fight: Fight): string {
  if (!fight.completed || !fight.winner) return "";
  if (!fight.method) return "Win";
  if (fight.method === "Decision") return "Decision";
  return fight.rounds ? `${fight.method}, round ${fight.rounds}` : fight.method;
}
