/**
 * Builds the golf season from ESPN's public scoreboard.
 *
 * The scoreboard only ever shows the current week, but it ships the season's
 * whole calendar alongside it — and asking for a date returns whatever was
 * played that day, full field. So the calendar gives the events and each
 * event's final day gives its leaderboard.
 *
 * Finished events never change, so they are fetched once and then left.
 *
 *   npm run golf:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import { MAJORS, type GolfEvent, type GolfPlayer } from "../lib/golf.ts";

const STORE = new URL("../data/golf.json", import.meta.url);
const BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  season: string;
  updated: string | null;
  events: GolfEvent[];
};

const board = await (await fetch(BASE)).json();
const league = board.leagues[0];
const season = String(league.season.year);
const calendar = league.calendar as {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}[];

const known = new Map(store.events.map((e) => [e.id, e]));
const today = new Date().toISOString().slice(0, 10);
let added = 0;
let updated = 0;

for (const entry of calendar) {
  const start = entry.startDate.slice(0, 10);
  const end = entry.endDate.slice(0, 10);
  if (start > today) continue;

  const existing = known.get(entry.id);
  // A finished event is finished; there is nothing to re-fetch.
  if (existing?.status === "Final") continue;

  const day = end.replace(/-/g, "");
  let events: unknown[];
  try {
    const res = await fetch(`${BASE}?dates=${day}`);
    if (!res.ok) {
      console.log(`  ! ${entry.label}: HTTP ${res.status}`);
      continue;
    }
    events = (await res.json()).events ?? [];
  } catch (error) {
    console.log(`  ! ${entry.label}: ${(error as Error).message}`);
    continue;
  }

  const match = (events as Record<string, unknown>[]).find(
    (e) => String(e.id) === entry.id || e.name === entry.label
  );
  if (!match) continue;

  const competition = (match.competitions as Record<string, unknown>[])[0];
  const status =
    ((match.status as Record<string, unknown>)?.type as Record<string, unknown>)
      ?.description as string;

  const leaderboard: GolfPlayer[] = (
    (competition?.competitors as Record<string, unknown>[]) ?? []
  )
    .map((c) => {
      const athlete = c.athlete as Record<string, unknown> | undefined;
      return {
        position: Number(c.order ?? 0),
        name: String(athlete?.displayName ?? ""),
        score: String(c.score ?? ""),
        country: (
          (athlete?.flag as Record<string, unknown>)?.alt as string | undefined
        ),
      };
    })
    .filter((p) => p.name)
    .sort((a, b) => a.position - b.position);

  const record: GolfEvent = {
    id: entry.id,
    name: entry.label,
    major: MAJORS.some((m) => entry.label.includes(m)),
    startDate: start,
    endDate: end,
    status: status ?? "Scheduled",
    venue: (competition?.venue as Record<string, unknown>)?.fullName as
      | string
      | undefined,
    winner: status === "Final" ? leaderboard[0]?.name : undefined,
    leaderboard,
  };

  if (existing) updated += 1;
  else added += 1;
  known.set(entry.id, record);
  console.log(
    `  ${existing ? "~" : "+"} ${record.major ? "★" : " "} ${record.name.padEnd(34)} ${record.status.padEnd(10)} ${record.winner ?? ""}`
  );

  await new Promise((r) => setTimeout(r, 400));
}

const events = [...known.values()].sort((a, b) =>
  a.startDate.localeCompare(b.startDate)
);
writeFileSync(
  STORE,
  `${JSON.stringify({ season, updated: new Date().toISOString(), events }, null, 2)}\n`
);
console.log(`\n${added} new, ${updated} refreshed, ${events.length} recorded`);
