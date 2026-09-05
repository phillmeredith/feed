/**
 * Reads the current F1 season from Jolpica into data/f1.json.
 *
 * Standings, calendar and every result so far, in one file the season pages
 * read directly. Jolpica is keyless but rate-limited, so this makes a handful
 * of calls on a schedule rather than one per page view.
 *
 *   npm run f1:update
 */
import { writeFileSync } from "node:fs";

const API = "https://api.jolpi.ca/ergast/f1";
const STORE = new URL("../data/f1.json", import.meta.url);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(path: string) {
  const res = await fetch(`${API}/${path}`, {
    headers: { Accept: "application/json", "User-Agent": "TheDispatch/1.0" },
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

const standings = await get("current/driverstandings/?format=json&limit=100");
const list = standings.MRData.StandingsTable.StandingsLists[0];

const drivers = list.DriverStandings.map((s: Record<string, never>) => {
  const row = s as unknown as {
    position: string; points: string; wins: string;
    Driver: { driverId: string; code?: string; givenName: string; familyName: string; nationality: string };
    Constructors: { constructorId: string; name: string }[];
  };
  return {
    position: Number(row.position),
    points: Number(row.points),
    wins: Number(row.wins),
    driverId: row.Driver.driverId,
    code: row.Driver.code ?? "",
    givenName: row.Driver.givenName,
    familyName: row.Driver.familyName,
    nationality: row.Driver.nationality,
    constructor: row.Constructors.at(-1)?.name ?? "",
    constructorId: row.Constructors.at(-1)?.constructorId ?? "",
  };
});

await sleep(600);
const teams = await get("current/constructorstandings/?format=json&limit=100");
const teamList = teams.MRData.StandingsTable.StandingsLists[0];
const constructors = teamList.ConstructorStandings.map((row: {
  position: string; points: string; wins: string;
  Constructor: { constructorId: string; name: string; nationality: string };
}) => ({
  position: Number(row.position),
  points: Number(row.points),
  wins: Number(row.wins),
  constructorId: row.Constructor.constructorId,
  name: row.Constructor.name,
  nationality: row.Constructor.nationality,
}));

await sleep(600);
const calendar = await get("current/races/?format=json&limit=100");

/*
 * Results are paginated and the API caps a page at 100 rows, which is five
 * races' worth — asking for 1000 silently returns the first hundred and looks
 * like a season that stopped in April. Walk the pages until the total is in.
 */
interface RawRaceResult {
  round: string;
  Results?: {
    position: string;
    Driver: { givenName: string; familyName: string };
    Constructor: { name: string };
    Time?: { time: string };
  }[];
}

const raceResults: RawRaceResult[] = [];
let offset = 0;
for (;;) {
  await sleep(600);
  const page = await get(`current/results/?format=json&limit=100&offset=${offset}`);
  const races = page.MRData.RaceTable.Races ?? [];
  raceResults.push(...races);
  const total = Number(page.MRData.total);
  offset += Number(page.MRData.limit);
  if (offset >= total || races.length === 0) break;
}

const resultsByRound = new Map<string, { position: number; driver: string; constructor: string; time?: string }[]>();
for (const race of raceResults) {
  const existing = resultsByRound.get(race.round) ?? [];
  resultsByRound.set(
    race.round,
    [...existing, ...(race.Results ?? []).map((r) => ({
      position: Number(r.position),
      driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
      constructor: r.Constructor.name,
      time: r.Time?.time,
    }))]
      .sort((a, b) => a.position - b.position)
      .slice(0, 10)
  );
}

const races = (calendar.MRData.RaceTable.Races ?? []).map((race: {
  round: string; raceName: string; date: string; time?: string;
  Circuit: { circuitId: string; circuitName: string; Location: { locality: string; country: string } };
}) => {
  const results = resultsByRound.get(race.round);
  return {
    round: Number(race.round),
    name: race.raceName,
    date: race.date,
    time: race.time,
    circuitId: race.Circuit.circuitId,
    circuitName: race.Circuit.circuitName,
    locality: race.Circuit.Location.locality,
    country: race.Circuit.Location.country,
    results,
    winner: results?.find((r) => r.position === 1)?.driver,
  };
});

writeFileSync(
  STORE,
  JSON.stringify(
    {
      season: list.season,
      round: Number(list.round),
      updated: new Date().toISOString(),
      drivers,
      constructors,
      races,
    },
    null,
    2
  ) + "\n"
);

const run = races.filter((r: { results?: unknown[] }) => r.results?.length).length;
console.log(
  `${list.season}: ${drivers.length} drivers, ${constructors.length} constructors, ${run}/${races.length} races run`
);
