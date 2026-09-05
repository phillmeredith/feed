/**
 * Builds the UFC season from ESPN's public scoreboard.
 *
 * The scoreboard shows the current card and ships the year's calendar beside
 * it; asking for a date returns that night's card in full. Two wrinkles: a
 * card that starts after midnight UTC is filed under the previous day, so
 * both are tried; and nothing in the payload says which bouts were the main
 * card, so the convention is used — the last five of the night.
 *
 *   npm run ufc:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Fight, UfcEvent } from "../lib/ufc.ts";

const STORE = new URL("../data/ufc.json", import.meta.url);
const BASE = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";

/** ESPN files finishes under a house vocabulary, typo included. */
const METHODS: [RegExp, string][] = [
  [/kotko|ko\/tko|knockout/i, "KO/TKO"],
  [/submission/i, "Submission"],
  [/decision/i, "Decision"],
  [/disqualification/i, "Disqualification"],
  [/no contest/i, "No contest"],
];

/** The main card is the last five bouts of the night. */
const MAIN_CARD_SIZE = 5;

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  season: string;
  updated: string | null;
  events: UfcEvent[];
};

const board = await (await fetch(BASE)).json();
const league = board.leagues[0];
const season = String(league.season?.year ?? new Date().getFullYear());
const calendar = (league.calendar ?? []) as {
  label: string;
  startDate: string;
}[];

const known = new Map(store.events.map((e) => [e.id, e]));
const now = new Date();
let added = 0;
let refreshed = 0;

function day(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

for (const entry of calendar) {
  const start = new Date(entry.startDate);
  if (start > now) {
    // Nothing to fetch for a card that hasn't happened; the calendar is enough.
    const id = `scheduled:${entry.startDate}`;
    if (!known.has(id)) {
      known.set(id, {
        id,
        name: entry.label,
        date: entry.startDate,
        status: "Scheduled",
        fights: [],
      });
      added += 1;
    }
    continue;
  }

  const before = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  let found: Record<string, unknown> | null = null;

  for (const date of [day(before), day(start)]) {
    try {
      const res = await fetch(`${BASE}?dates=${date}`);
      if (!res.ok) continue;
      const events = ((await res.json()).events ?? []) as Record<
        string,
        unknown
      >[];
      found = events.find((e) => e.name === entry.label) ?? null;
      if (found) break;
    } catch {
      // A single missing night shouldn't stop the season.
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!found) continue;

  const id = String(found.id);
  const existing = known.get(id);
  const status =
    ((found.status as Record<string, unknown>)?.type as Record<string, unknown>)
      ?.description as string;
  // A finished card never changes.
  if (existing?.status === "Final" && status === "Final") continue;

  const bouts = (found.competitions ?? []) as Record<string, unknown>[];
  const mainFrom = Math.max(0, bouts.length - MAIN_CARD_SIZE);

  const fights: Fight[] = bouts.map((bout, index) => {
    const competitors = (bout.competitors ?? []) as Record<string, unknown>[];
    const fighters = competitors.map(
      (c) => String((c.athlete as Record<string, unknown>)?.displayName ?? "")
    );
    const winner = competitors.find((c) => c.winner);
    const boutStatus = (bout.status ?? {}) as Record<string, unknown>;
    const details = ((bout.details ?? []) as Record<string, unknown>[]).map(
      (d) => String((d.type as Record<string, unknown>)?.text ?? "")
    );
    const method = METHODS.find(([pattern]) =>
      details.some((text) => /winner/i.test(text) && pattern.test(text))
    )?.[1];

    return {
      segment: index >= mainFrom ? "main" : "prelim",
      weightClass: String(
        (bout.type as Record<string, unknown>)?.abbreviation ?? ""
      ),
      fighters: fighters.filter(Boolean),
      winner: winner
        ? String((winner.athlete as Record<string, unknown>)?.displayName ?? "")
        : undefined,
      method,
      rounds: Number(boutStatus.period ?? 0) || undefined,
      // The night's last bout tops the bill; the one before is the co-main.
      headline: index >= bouts.length - 2,
      completed: Boolean(
        (boutStatus.type as Record<string, unknown>)?.completed
      ),
    };
  });

  const competition = bouts[0] ?? {};
  const venue = (competition.venue ?? {}) as Record<string, unknown>;
  const address = (venue.address ?? {}) as Record<string, unknown>;

  const record: UfcEvent = {
    id,
    name: String(found.name),
    date: String(found.date),
    status: status ?? "Scheduled",
    venue: (venue.fullName as string) || undefined,
    location: [address.city, address.country].filter(Boolean).join(", ") || undefined,
    fights,
  };

  // A scheduled placeholder is superseded once the real card has an id.
  known.delete(`scheduled:${entry.startDate}`);
  if (existing) refreshed += 1;
  else added += 1;
  known.set(id, record);
  console.log(
    `  ${existing ? "~" : "+"} ${record.name.slice(0, 42).padEnd(42)} ${record.status.padEnd(11)} ${fights.length} bouts`
  );

  await new Promise((r) => setTimeout(r, 400));
}

const events = [...known.values()].sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(
  STORE,
  `${JSON.stringify({ season, updated: new Date().toISOString(), events }, null, 2)}\n`
);
console.log(`\n${added} new, ${refreshed} refreshed, ${events.length} recorded`);
