import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Append-only observations: a value, a date, and where it came from.
 *
 * The other stores in `data/` overwrite on every run, which is right for a
 * directory of what exists but wrong for anything whose history is the point.
 * A price, an Elo rating or a CO₂ reading is only interesting next to what it
 * was last month, and nobody sells that back to you retroactively — you can
 * only start keeping it. Hence JSONL, appended and committed: free, diffable,
 * versioned, and readable without a database.
 */
export interface Observation {
  /** Entity this is about, e.g. "openai/gpt-5". */
  slug: string;
  /** What was measured, e.g. "price.input" or "downloads". */
  metric: string;
  value: number;
  /** "USD/Mtok", "GBP", "count" — kept per observation, since units drift. */
  unit: string;
  /** ISO date of the observation. */
  at: string;
  /** Provenance, so a licensing question has an answer. */
  source: string;
}

export const SERIES_DIR = join(process.cwd(), "data", "series");

/** One file per metric family, so a reader never parses more than it needs. */
export function seriesPath(family: string) {
  return join(SERIES_DIR, `${family}.jsonl`);
}

export function readSeries(family: string): Observation[] {
  const path = seriesPath(family);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Observation];
      } catch {
        // A truncated final line shouldn't take the page down.
        return [];
      }
    });
}

export function seriesFamilies(): string[] {
  if (!existsSync(SERIES_DIR)) return [];
  return readdirSync(SERIES_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => f.replace(/\.jsonl$/, ""));
}

/** Every observation for one entity and metric, oldest first. */
export function history(
  family: string,
  slug: string,
  metric: string
): Observation[] {
  return readSeries(family)
    .filter((o) => o.slug === slug && o.metric === metric)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export interface Movement {
  latest: Observation;
  first: Observation;
  changePct: number;
  points: number;
}

/** Where a value is now against where it started, for a sparkline caption. */
export function movement(points: Observation[]): Movement | null {
  if (points.length === 0) return null;
  const first = points[0];
  const latest = points[points.length - 1];
  const changePct =
    first.value === 0 ? 0 : ((latest.value - first.value) / first.value) * 100;
  return { latest, first, changePct, points: points.length };
}
