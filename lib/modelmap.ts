import { allModels, blendedPrice, type CatalogueModel } from "./catalogue";

/**
 * The catalogue, read as a history rather than as a list.
 *
 * `/model` answers "what can I use and what does it cost". These answer a
 * different question — what has happened to these things over three years —
 * which the same 426 rows can be made to say and no page was asking them.
 *
 * Everything here is derived from fields the catalogue actually carries:
 * a release date, a lab, two prices, a context window and a modality string.
 * There are no benchmark scores in this data and none are invented; where a
 * measure would need one, it is not here.
 */

/** A model as a point on the map. */
export interface MapPoint {
  id: string;
  name: string;
  lab: string;
  at: string;
  context: number;
  /** Blended $/M tokens, or null where the lab publishes no price. */
  price: number | null;
  /** What it can be given: text only, or text and something else. */
  multimodal: boolean;
}

/** Labs drawn in their own ink; everything else shares the muted one. */
export const MAPPED_LABS = 6;

function normaliseLab(lab: string) {
  // The catalogue carries "Meta" and "meta" as separate labs, and a handful
  // of others differ only in case. On a chart that is two dots in two
  // colours for one company.
  return lab.trim().toLowerCase();
}

export function labLabel(lab: string) {
  const seen = allModels().find((m) => normaliseLab(m.lab) === normaliseLab(lab));
  return seen?.lab ?? lab;
}

/** Every catalogued model that carries a date and a context window. */
export function mapPoints(): MapPoint[] {
  return allModels()
    .filter(
      (m): m is CatalogueModel & { releasedAt: string } =>
        Boolean(m.releasedAt) && m.contextTokens > 0
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      lab: m.lab,
      at: m.releasedAt,
      context: m.contextTokens,
      price: blendedPrice(m),
      multimodal: (m.inputModalities?.length ?? 1) > 1,
    }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** The labs with the most releases, which are the ones worth their own ink. */
export function principalLabs(points: MapPoint[], count = MAPPED_LABS) {
  const tally = new Map<string, { label: string; n: number }>();
  for (const p of points) {
    const key = normaliseLab(p.lab);
    const seen = tally.get(key);
    tally.set(key, { label: seen?.label ?? p.lab, n: (seen?.n ?? 0) + 1 });
  }
  return [...tally.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, count)
    .map(([key, v]) => ({ key, label: v.label, count: v.n }));
}

export function labKey(lab: string) {
  return normaliseLab(lab);
}

/**
 * The running maximum context window.
 *
 * A scatter of four hundred dots shows spread; this shows the argument. Every
 * step is a model that could hold more than anything before it, which is the
 * one line of this history everybody already half-remembers.
 */
export function contextFrontier(points: MapPoint[]) {
  const steps: MapPoint[] = [];
  let best = 0;
  for (const p of points) {
    if (p.context > best) {
      best = p.context;
      steps.push(p);
    }
  }
  return steps;
}

/** Quarters, as buckets and as labels. */
export function quarterOf(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

export function quarterLabel(q: string) {
  const [year, quarter] = q.split("-");
  return `${quarter} ${year.slice(2)}`;
}

function byQuarter<T>(points: MapPoint[], reduce: (group: MapPoint[]) => T) {
  const groups = new Map<string, MapPoint[]>();
  for (const p of points) {
    const q = quarterOf(p.at);
    groups.set(q, [...(groups.get(q) ?? []), p]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([quarter, group]) => ({ quarter, value: reduce(group), n: group.length }));
}

/**
 * What a model released that quarter typically cost.
 *
 * The median, not the floor. The floor is whatever loss-leader shipped that
 * quarter and jumps by a factor of thirty between neighbouring bars, which
 * measures one lab's pricing decision rather than the market. Free models
 * are left out either way: "nothing" is a business model, not a price, and
 * one of them drags any average to the floor.
 */
export function priceMedian(points: MapPoint[]) {
  return byQuarter(points, (group) => {
    const paid = group
      .map((p) => p.price)
      .filter((p): p is number => p !== null && p > 0)
      .sort((a, b) => a - b);
    if (paid.length === 0) return null;
    return paid[Math.floor(paid.length / 2)];
  }).filter((q) => q.value !== null) as { quarter: string; value: number; n: number }[];
}

/**
 * How many labs shipped anything, quarter by quarter.
 *
 * The count of models says the field is moving faster; this says whether it
 * is moving faster because more people are in it.
 */
export function labsActive(points: MapPoint[]) {
  return byQuarter(points, (group) => new Set(group.map((p) => labKey(p.lab))).size);
}

/** How many models a quarter brought, and how many of those took more than text. */
export function cadence(points: MapPoint[]) {
  return byQuarter(points, (group) => group.filter((p) => p.multimodal).length).map(
    (q) => ({ quarter: q.quarter, released: q.n, multimodal: q.value })
  );
}

/** The largest context window anyone had shipped by the end of each quarter. */
export function contextCeiling(points: MapPoint[]) {
  let best = 0;
  return byQuarter(points, (group) => {
    best = Math.max(best, ...group.map((p) => p.context));
    return best;
  });
}

/**
 * The first model past each threshold — the dates the ceiling moved.
 *
 * Thresholds a reader recognises rather than a round number of tokens: a long
 * report, a novel, a shelf.
 */
const THRESHOLDS = [
  { tokens: 32_000, as: "a long report" },
  { tokens: 128_000, as: "a short book" },
  { tokens: 1_000_000, as: "a shelf of them" },
  { tokens: 2_000_000, as: "twice that again" },
];

export function milestones(points: MapPoint[]) {
  const found = THRESHOLDS.map(({ tokens, as }) => {
    const first = points.find((p) => p.context >= tokens);
    return first ? { tokens, as, model: first } : null;
  }).filter((m): m is { tokens: number; as: string; model: MapPoint } => m !== null);

  /*
   * One model per line. Nothing shipped between sixteen thousand tokens and a
   * hundred and twenty-eight, so the same model was the first past both
   * thresholds and the list printed it twice — which reads as a mistake
   * rather than as the jump it actually was. The highest bar a model cleared
   * is the one it gets.
   */
  return found.filter(
    (m, i) => i === found.length - 1 || found[i + 1].model.id !== m.model.id
  );
}

/** Everything the map and the panels under it need, read once. */
export function modelHistory() {
  const points = mapPoints();
  return {
    points,
    labs: principalLabs(points),
    frontier: contextFrontier(points),
    price: priceMedian(points),
    cadence: cadence(points),
    labsActive: labsActive(points),
    ceiling: contextCeiling(points),
    milestones: milestones(points),
    span: {
      from: points[0]?.at ?? "",
      to: points[points.length - 1]?.at ?? "",
    },
  };
}

export type ModelHistory = ReturnType<typeof modelHistory>;
export type { CatalogueModel };
