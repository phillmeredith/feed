import store from "../data/model-catalogue.json" with { type: "json" };
import type { CatalogueModel } from "./openrouter";
import { modelSlug } from "./openrouter";
import type { Article } from "./types";

export type { CatalogueModel };

const ITEMS = store.items as CatalogueModel[];

const BY_SLUG = new Map(ITEMS.map((m) => [modelSlug(m.id), m]));

export function allModels(): CatalogueModel[] {
  return ITEMS;
}

export function modelBySlug(slug: string): CatalogueModel | null {
  return BY_SLUG.get(slug) ?? null;
}

export function catalogueUpdated(): string {
  return store.updated;
}

/** Every lab with at least one priced model, most models first. */
export function labs(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of ITEMS) counts.set(m.lab, (counts.get(m.lab) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Blended cost of a million tokens at a typical read-heavy ratio — three parts
 * in to one part out. Comparing on input price alone flatters models that
 * charge five times as much to answer, which is most of them.
 */
export function blendedPrice(m: CatalogueModel): number | null {
  if (m.inputPrice === null || m.outputPrice === null) return null;
  return m.inputPrice * 0.75 + m.outputPrice * 0.25;
}

export function formatPrice(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "free";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatContext(tokens: number): string {
  if (tokens <= 0) return "—";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
}

/** "text+image->text" reads better as the inputs it actually accepts. */
export function formatModality(m: CatalogueModel): string {
  if (m.inputModalities.length === 0) return "text";
  const order = ["text", "image", "audio", "video", "file"];
  return [...m.inputModalities]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .join(" · ");
}

/** Names differ in punctuation and spacing between sources; compare on letters. */
function normalise(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const BY_NAME = new Map<string, CatalogueModel>();
for (const m of ITEMS) {
  // First wins: the catalogue is release-ordered, so the base model beats its
  // own batch and preview variants for the plain name.
  const key = normalise(m.name);
  if (!BY_NAME.has(key)) BY_NAME.set(key, m);
}

/**
 * The catalogue entry for a release named elsewhere — the Hub's id, or a name
 * recovered from a headline. Returns null rather than guessing: a wrong link
 * is worse than no link.
 */
export function matchByName(name: string): CatalogueModel | null {
  return BY_NAME.get(normalise(name)) ?? null;
}

/**
 * Stories about this model, from the desk's own coverage.
 *
 * Matching is deliberately strict: the bare model name only, as a whole word.
 * Loose matching put every story mentioning "Claude" on the Opus page, which
 * is worse than showing none.
 */
export function storiesAbout(model: CatalogueModel, articles: Article[]): Article[] {
  const name = model.name.trim();
  if (name.length < 3) return [];
  const pattern = new RegExp(
    `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i"
  );
  return articles
    .filter((a) => pattern.test(a.headline) || pattern.test(a.dek))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 8);
}
