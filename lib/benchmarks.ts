import store from "../data/benchmarks.json" with { type: "json" };

/**
 * Benchmark scores, from Epoch AI's benchmarking hub.
 *
 * The model catalogue records what a model costs, how much it holds and what
 * it accepts. It does not record how well it does anything, and for a while
 * this site said so and stopped there — which was honest and not much use.
 *
 * Epoch AI run the evaluations themselves and publish the results under a
 * Creative Commons Attribution licence, with the one thing that makes a chart
 * of them possible: a release date against every score. Their attribution is
 * carried on the page, not just here.
 *
 *   npm run benchmarks:update
 */

export interface Score {
  /** The model as the evaluators named it. */
  model: string;
  org: string;
  /** Release date of the model, not of the evaluation. */
  at: string;
  /** 0–1, already scaled. */
  score: number;
}

export interface Benchmark {
  key: string;
  name: string;
  /** What the benchmark is actually asking, in a line. */
  asks: string;
  /** What a model scores by guessing. Below this a line means nothing. */
  baseline: number;
  /** Highest score attainable, where it is not 1. */
  ceiling: number;
  /** Set where the benchmark has been retired or beaten. */
  retired?: string;
  scores: Score[];
}

interface Store {
  updated: string;
  source: string;
  licence: string;
  benchmarks: Benchmark[];
}

const data = store as Store;

export function allBenchmarks(): Benchmark[] {
  return data.benchmarks.filter((b) => b.scores.length > 0);
}

export function benchmarkByKey(key: string): Benchmark | null {
  return allBenchmarks().find((b) => b.key === key) ?? null;
}

export function benchmarksUpdated() {
  return data.updated;
}

export const BENCHMARK_SOURCE = data.source;
export const BENCHMARK_LICENCE = data.licence;

/**
 * The running best score, in release-date order.
 *
 * A scatter of three hundred results shows how crowded the field is; this
 * shows where the ceiling actually moved, which is a different and shorter
 * list. Ties are ignored — only a model that beat everything before it.
 */
export function frontier(b: Benchmark): Score[] {
  const steps: Score[] = [];
  let best = -Infinity;
  for (const s of [...b.scores].sort((x, y) => x.at.localeCompare(y.at))) {
    if (s.score > best) {
      best = s.score;
      steps.push(s);
    }
  }
  return steps;
}

/** Where a benchmark stands: the best anyone has managed, and when. */
export function standing(b: Benchmark) {
  const steps = frontier(b);
  const top = steps[steps.length - 1];
  const first = [...b.scores].sort((x, y) => x.at.localeCompare(y.at))[0];
  return {
    top,
    first,
    /** Saturated: the leader is within a whisker of the ceiling. */
    saturated: top ? top.score >= b.ceiling - 0.02 : false,
  };
}
