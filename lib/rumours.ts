import type { Article } from "./types";
import { allGear, gearSlug } from "./gearspec";
import type { GearItem } from "./gear";

/**
 * What hasn't been announced yet.
 *
 * The two rumour sites this desk already reads exist to report kit before it
 * exists, and that reporting is thrown away the moment it scrolls off a feed —
 * which is exactly when it becomes checkable. Holding it produces the thing no
 * manufacturer will publish and no shop will show you: what was expected, how
 * confidently, and whether it turned out to be true.
 *
 * Everything here comes from feeds already ingested. No new source, no key.
 */
export interface Rumour {
  id: string;
  headline: string;
  dek: string;
  source: string;
  storyId: string;
  firstHeard: string;
  confidence: Confidence;
  /** Set once a matching product appears in the gear directory. */
  resolved: { name: string; slug: string; announcedAt: string } | null;
}

export type Confidence = "confirmed" | "likely" | "speculative";

/** The sites whose entire remit is unannounced kit. */
const RUMOUR_SOURCES = /sony ?alpha ?rumors|fuji ?rumors/i;

/*
 * Rumour sites grade their own reporting, and the vocabulary is consistent
 * enough to read: a leaked spec sheet is not a wish list, and both are written
 * differently from "could" and "we hear".
 */
const CONFIRMED = /\b(leaked|confirmed|official(ly)?|specs? (?:leaked|revealed)|images? leaked|full specs?)\b/i;
const SPECULATIVE = /\b(could|might|maybe|rumou?red to|we hear|wish ?list|what (?:if|we want)|hope|speculat\w*|possibly)\b/i;

/** Posts that are not about a forthcoming product at all. */
const NOT_A_RUMOUR =
  /\b(deal|deals|sale|discount|save \$|% off|refurbished|in stock|back in stock|giveaway|contest|poll|survey|stay tuned|coming soon\b.{0,20}$)\b/i;

/*
 * The rumour sites also file the announcement itself. Present-tense launch
 * language marks the news rather than the anticipation of it — and a "rumour"
 * that turns out to have predicted something zero days ahead predicted
 * nothing. Leak framing ("will announce", "announced to be") is left alone.
 */
const IS_THE_ANNOUNCEMENT =
  /\b(launches|announces|unveils|introduces|releases|debuts|officially announced|now available|goes on sale)\b/i;

/** A rumour names a product: a brand, and something that looks like a model. */
const PRODUCT_SHAPE =
  /\b(sony|fujifilm|fujinon|canon|nikon|sigma|tamron|panasonic|lumix|om system|olympus|leica|viltrox|samyang|zeiss|tokina|laowa)\b/i;

function confidenceOf(text: string): Confidence {
  if (CONFIRMED.test(text)) return "confirmed";
  if (SPECULATIVE.test(text)) return "speculative";
  return "likely";
}

/**
 * A rumour is resolved when a product it plainly names turns up in the
 * directory, announced after the rumour was filed. Matching demands the brand
 * plus a model token, so "a new Sony lens" resolves to nothing — which is
 * correct, since it predicted nothing checkable.
 */
function resolutionFor(
  headline: string,
  firstHeard: string,
  catalogue: GearItem[]
): Rumour["resolved"] {
  const text = headline.toLowerCase();

  for (const item of catalogue) {
    if (item.announcedAt <= firstHeard) continue;

    const tokens = item.name
      .toLowerCase()
      .replace(/[^a-z0-9.\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
    if (tokens.length < 2) continue;

    // Brand plus at least one distinctive model token, e.g. "400mm" or "gfx100".
    const distinctive = tokens.slice(1).filter((t) => /\d/.test(t));
    if (distinctive.length === 0) continue;

    if (text.includes(tokens[0]) && distinctive.some((t) => text.includes(t))) {
      return {
        name: item.name,
        slug: gearSlug(item.name),
        announcedAt: item.announcedAt,
      };
    }
  }

  return null;
}

export function rumoursFrom(articles: Article[]): Rumour[] {
  const catalogue = allGear();
  const seen = new Set<string>();
  const rumours: Rumour[] = [];

  for (const article of articles) {
    if (!RUMOUR_SOURCES.test(article.source)) continue;
    if (NOT_A_RUMOUR.test(article.headline)) continue;
    if (IS_THE_ANNOUNCEMENT.test(article.headline)) continue;
    if (!PRODUCT_SHAPE.test(article.headline)) continue;

    const key = article.headline.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);

    rumours.push({
      id: article.id,
      headline: article.headline,
      dek: article.dek,
      source: article.source,
      storyId: article.id,
      firstHeard: article.publishedAt,
      confidence: confidenceOf(`${article.headline} ${article.dek}`),
      resolved: resolutionFor(article.headline, article.publishedAt, catalogue),
    });
  }

  // Outstanding first, newest of those at the top: what's still coming is the
  // point, and what already landed is the scorecard.
  return rumours.sort((a, b) => {
    if (Boolean(a.resolved) !== Boolean(b.resolved)) return a.resolved ? 1 : -1;
    return b.firstHeard.localeCompare(a.firstHeard);
  });
}

export interface RumourTally {
  outstanding: number;
  resolved: number;
  total: number;
}

export function tally(rumours: Rumour[]): RumourTally {
  const resolved = rumours.filter((r) => r.resolved).length;
  return { outstanding: rumours.length - resolved, resolved, total: rumours.length };
}
