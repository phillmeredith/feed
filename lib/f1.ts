import store from "../data/f1.json" with { type: "json" };

/**
 * Formula 1, from Jolpica — the community successor to Ergast.
 *
 * The most complete free sports data anywhere: standings, calendar, results,
 * qualifying and lap times, keyless and back to 1950. It is read by a scheduled
 * script into `data/f1.json` rather than at request time, so the season pages
 * cost a render.
 */
export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  nationality: string;
  constructor: string;
  constructorId: string;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  name: string;
  nationality: string;
}

export interface Race {
  round: number;
  name: string;
  date: string;
  time?: string;
  circuitId: string;
  circuitName: string;
  locality: string;
  country: string;
  /** Podium, once the race has run. */
  results?: { position: number; driver: string; constructor: string; time?: string }[];
  winner?: string;
}

export interface Season {
  season: string;
  round: number;
  updated: string;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  races: Race[];
}

const SEASON = store as unknown as Season;

export function season(): Season {
  return SEASON;
}

export function driverStandings(): DriverStanding[] {
  return SEASON.drivers;
}

export function constructorStandings(): ConstructorStanding[] {
  return SEASON.constructors;
}

export function races(): Race[] {
  return SEASON.races;
}

export function driverById(id: string): DriverStanding | null {
  return SEASON.drivers.find((d) => d.driverId === id) ?? null;
}

export function driverName(d: DriverStanding) {
  return `${d.givenName} ${d.familyName}`;
}

/** Races already run, newest first. */
export function completed(): Race[] {
  return SEASON.races.filter((r) => r.results?.length).reverse();
}

/** The next race that hasn't happened, by the calendar rather than results. */
export function nextRace(now = new Date()): Race | null {
  return (
    SEASON.races.find((r) => new Date(`${r.date}T${r.time ?? "12:00:00Z"}`) > now) ??
    null
  );
}

/** Every finish this season for one driver, oldest first. */
export function resultsFor(driverId: string) {
  const driver = driverById(driverId);
  if (!driver) return [];
  const full = driverName(driver);

  return SEASON.races
    .filter((r) => r.results?.some((res) => res.driver === full))
    .map((r) => ({
      round: r.round,
      race: r.name,
      country: r.country,
      position: r.results!.find((res) => res.driver === full)!.position,
    }));
}

export function seasonUpdated(): string {
  return SEASON.updated;
}
