import type { GearItem } from "./gear";
import store from "../data/videos.json" with { type: "json" };

/**
 * Video coverage, without an API key.
 *
 * YouTube still publishes an Atom feed per channel — title, id, date,
 * thumbnail and view count — and it needs no key, no quota and no account.
 * What it does not do is go back: fifteen videos per channel, and a review
 * that scrolls off is gone. So this works like the archive and the gear
 * directory, accumulating into data/videos.json rather than being read live.
 *
 * The channels are an allowlist, deliberately. The point is coverage of a
 * product by someone who has actually used it — not whatever the algorithm
 * thinks a search for "a7 V" means.
 */
export interface TrustedChannel {
  id: string;
  name: string;
  /** What this channel is worth watching for. */
  beat: "photography" | "hardware";
}

export const CHANNELS: TrustedChannel[] = [
  { id: "UCqP1gIWh2SM3lRXf373gMNQ", name: "DPReview TV", beat: "photography" },
  { id: "UC09qASY4ixFS-KXIH6Nw0rg", name: "Gerald Undone", beat: "photography" },
  { id: "UCoJP9pYqZjiJOlR4UWdPhow", name: "PetaPixel", beat: "photography" },
  { id: "UCxoyIXANauK4cEfy0Wc09IA", name: "Christopher Frost", beat: "photography" },
  { id: "UCrmU_ja6Ea7G1RYGfy3zeVA", name: "Dustin Abbott", beat: "photography" },
  { id: "UCBJycsmduvYEL83R_U4JriQ", name: "Marques Brownlee", beat: "hardware" },
  { id: "UC-6OW5aJYBFM33zXQlBKPNA", name: "Engadget", beat: "hardware" },
];

export interface Video {
  id: string;
  title: string;
  channel: string;
  beat: "photography" | "hardware";
  publishedAt: string;
  views: number;
}

const ITEMS = store.items as Video[];

/** Shorts and streams are not coverage; neither is a teaser. */
const NOT_COVERAGE =
  /\b(shorts?|#shorts|teaser|trailer|live ?stream|podcast|q ?& ?a|giveaway|vlog|behind the scenes)\b/i;

/**
 * Product names and video titles rarely agree on punctuation. "Sony a7R VI",
 * "Sony A7RVI" and "a7r vi" are the same camera; so are "XF400mmF4.5" and
 * "XF 400mm f/4.5". Flattening both sides to letters and digits lets a plain
 * containment test do the work.
 */
function flatten(text: string) {
  return text
    .toLowerCase()
    .replace(/[αa]lpha/g, "a")
    .replace(/α/g, "a")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Roman numerals in a product name are a matching hazard: "a7 IV" flattened is
 * "a7iv", which is a substring of "a7ivs" but *not* of "a7 mark iv". Both
 * spellings are produced so either matches.
 */
function variants(name: string): string[] {
  const flat = flatten(name);
  const marked = flatten(name.replace(/\b(I{1,3}V?|VI{0,3}|IX|X)\b/gi, "mark $1"));
  return marked === flat ? [flat] : [flat, marked];
}

/**
 * Coverage of one product, best first.
 *
 * "Best" is recency weighted by audience: a review with a hundred thousand
 * views is more likely to be the definitive one than a first-look filed a day
 * earlier. Neither alone is a good sort — views favour whatever is oldest, and
 * date favours whatever is thinnest.
 */
export function videosFor(item: GearItem, limit = 4): Video[] {
  const keys = variants(item.name);
  const brand = flatten(item.brand);

  const matches = ITEMS.filter((v) => {
    if (NOT_COVERAGE.test(v.title)) return false;
    const title = flatten(v.title);
    // The brand alone is far too broad — "Sony" matches half the feed.
    if (!keys.some((k) => title.includes(k))) return false;
    return title.includes(brand) || keys.some((k) => k.includes(brand));
  });

  const now = Date.now();
  return matches
    .sort((a, b) => score(b, now) - score(a, now))
    .slice(0, limit);
}

function score(v: Video, now: number) {
  const days = Math.max(1, (now - Date.parse(v.publishedAt)) / 86_400_000);
  return Math.log10(Math.max(v.views, 10)) / Math.log10(days + 2);
}

/** The newest coverage on a beat, for a desk that has no single product. */
export function recentVideos(beat: Video["beat"], limit = 6): Video[] {
  return ITEMS.filter((v) => v.beat === beat && !NOT_COVERAGE.test(v.title))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function videoCount() {
  return ITEMS.length;
}
