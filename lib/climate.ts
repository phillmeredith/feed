import store from "../data/climate.json" with { type: "json" };

/**
 * The state of the climate system, in three numbers.
 *
 * The weather desk opened on a forecast and then ran a list of headlines
 * about the planet, which tells a reader what was written this week and
 * nothing about where things actually stand. These are the measurements the
 * reporting is about: how much carbon is in the air, how far above the
 * twentieth-century average the surface is running, and what the Pacific is
 * doing — which is the single biggest control on what any given year's
 * weather will be like.
 *
 * All three are published, keyless, by the agencies that make them: NOAA's
 * Global Monitoring Laboratory, NASA GISS, and NOAA's Climate Prediction
 * Centre. A scheduled script reads them into data/climate.json.
 */
export interface Reading {
  /** ISO date or a period label like "JJA 2026". */
  at: string;
  value: number;
}

export interface Indicator {
  key: "co2" | "anomaly" | "enso";
  label: string;
  /** What the number is, in a sentence a non-specialist can use. */
  note: string;
  value: number;
  unit: string;
  /** Change against the same point a year earlier, where that's meaningful. */
  yearChange?: number;
  /** Recent history for the sparkline, oldest first. */
  history: Reading[];
  source: string;
  updated: string;
}

interface Store {
  updated: string | null;
  indicators: Indicator[];
}

const STORE = store as unknown as Store;

export function climateIndicators(): Indicator[] {
  return STORE.indicators ?? [];
}

export function climateUpdated(): string | null {
  return STORE.updated;
}

/**
 * What the Oceanic Niño Index is saying, in the words the agencies use.
 * ±0.5 is the threshold for conditions; ±1.5 is conventionally "strong".
 */
export function ensoPhase(oni: number): string {
  if (oni >= 2) return "Very strong El Niño";
  if (oni >= 1.5) return "Strong El Niño";
  if (oni >= 1) return "Moderate El Niño";
  if (oni >= 0.5) return "Weak El Niño";
  if (oni <= -1.5) return "Strong La Niña";
  if (oni <= -1) return "Moderate La Niña";
  if (oni <= -0.5) return "Weak La Niña";
  return "Neutral";
}
