import type { Article } from "./types";
import store from "../data/gear.json" with { type: "json" };

export interface GearItem {
  name: string;
  brand: string;
  kind: "body" | "lens";
  /** Third-party lens makers, as opposed to a camera brand's own glass. */
  independent: boolean;
  announcedAt: string;
  /** Mounts a lens is made for, from DPReview's specs. */
  mounts?: string[];
  /** Focal length, e.g. "85mm" or "24-70mm". */
  focal?: string;
  /** Where the entry came from. */
  source?: "dpreview" | "coverage";
  /** Set when this desk covered the announcement. */
  storyId?: string;
  headline?: string;
}

/** Camera makers and the lens brands that make glass for other people's mounts. */
const CAMERA_BRANDS = [
  "Sony", "Canon", "Nikon", "Fujifilm", "Panasonic", "Lumix", "OM System",
  "Olympus", "Leica", "Hasselblad", "Pentax", "Ricoh", "Blackmagic", "DJI",
  "Phase One", "Sigma", "Insta360", "GoPro",
];

const INDEPENDENT_BRANDS = [
  "Sigma", "Tamron", "Samyang", "Rokinon", "Viltrox", "Laowa", "Venus Optics",
  "TTArtisan", "7Artisans", "Zeiss", "Tokina", "Meike", "Voigtlander",
  "Voigtländer", "Thypoch", "Sirui", "NiSi",
];

/** Fujifilm's glass is branded Fujinon, Nikon's Nikkor. */
const BRAND_ALIASES: Record<string, string> = {
  Fujinon: "Fujifilm",
  Nikkor: "Nikon",
  Lumix: "Panasonic",
  Rokinon: "Samyang",
  "Venus Optics": "Laowa",
  Voigtländer: "Voigtlander",
};

const ALL_BRANDS = [...new Set([...CAMERA_BRANDS, ...INDEPENDENT_BRANDS, "Fujinon", "Nikkor"])];

/** A focal length or aperture in the name means it's glass, not a body. */
const LENS_SIGNAL = /\b\d{1,3}(-\d{1,3})?\s?mm\b|\bf\/?\d(\.\d)?\b/i;

/**
 * Pulls the product out of an announcement headline: the brand, then the model
 * tokens that follow it. Deliberately conservative — a headline that doesn't
 * name a product in a recognisable shape is skipped rather than guessed at.
 */
function productFrom(headline: string): { brand: string; name: string } | null {
  for (const brand of ALL_BRANDS) {
    const at = headline.search(new RegExp(`\\b${brand}\\b`, "i"));
    if (at === -1) continue;

    const after = headline.slice(at + brand.length);
    // Model tokens: alphanumerics, focal lengths, apertures — stop at prose.
    const match = after.match(
      /^(?:'s)?\s+((?:[A-Z0-9][A-Za-z0-9./-]*|\d+(?:-\d+)?\s?mm|f\/?\d(?:\.\d)?)(?:\s+(?:[A-Z0-9][A-Za-z0-9./-]*|\d+(?:-\d+)?\s?mm|f\/?\d(?:\.\d)?)){0,4})/
    );
    if (!match) continue;

    const name = match[1]
      .replace(/[,.:;!?]+$/, "")
      .replace(/\s+(is|are|to|for|with|and|the|now|gets|adds)$/i, "")
      .trim();
    if (name.length < 2 || /^(the|new|is|has)$/i.test(name)) continue;

    const canonical = BRAND_ALIASES[brand] ?? brand;
    return { brand: canonical, name: `${canonical} ${name}` };
  }
  return null;
}

const ANNOUNCEMENT =
  /\b(announce\w*|launch\w*|unveil\w*|introduc\w*|releas\w*|debut\w*|reveal\w*|ship\w*|pric\w*|now available|goes on sale|available now|in stock|pre-?order\w*)\b/i;

/**
 * A directory built from the desk's own coverage: everything announced in the
 * window The Dispatch holds, newest first. It is not a historical catalogue —
 * no free source publishes one — but it is accurate about what has just landed,
 * and every entry links to the story here rather than off-site.
 */
export function gearFrom(articles: Article[]): GearItem[] {
  const items = new Map<string, GearItem>();

  for (const article of articles) {
    if (article.category !== "cameras") continue;
    if (!ANNOUNCEMENT.test(article.headline)) continue;

    const product = productFrom(article.headline);
    if (!product) continue;

    const isLens = LENS_SIGNAL.test(product.name);
    const key = product.name.toLowerCase().replace(/\s+/g, " ");
    const existing = items.get(key);

    // Keep the earliest mention: that's the announcement.
    if (existing && existing.announcedAt <= article.publishedAt) continue;

    items.set(key, {
      source: "coverage",
      name: product.name,
      brand: product.brand,
      kind: isLens ? "lens" : "body",
      independent: INDEPENDENT_BRANDS.some(
        (b) => (BRAND_ALIASES[b] ?? b) === product.brand
      ),
      announcedAt: article.publishedAt,
      storyId: article.id,
      headline: article.headline,
    });
  }

  return [...items.values()].sort((a, b) =>
    b.announcedAt.localeCompare(a.announcedAt)
  );
}

/**
 * The directory as shown: everything ever recorded by `npm run gear:update`,
 * merged with whatever the desk is carrying right now.
 */
export function gearDirectory(articles: Article[]): GearItem[] {
  const merged = new Map<string, GearItem>();
  for (const item of store.items as GearItem[]) {
    merged.set(item.name.toLowerCase(), item);
  }
  for (const item of gearFrom(articles)) {
    merged.set(item.name.toLowerCase(), item);
  }
  return [...merged.values()].sort((a, b) =>
    b.announcedAt.localeCompare(a.announcedAt)
  );
}
