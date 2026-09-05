/**
 * Imports DPReview's product database into the camera directory.
 *
 * Their database is the only usable catalogue of bodies and lenses, but it sits
 * behind Cloudflare and exposes no announcement date — only the WordPress post
 * date. That date is reliable for records created when the product was
 * announced, and wrong for a batch of legacy stock migrated in 2026, which is
 * filtered out during export (see docs/BACKLOG.md).
 *
 * Export lands in data/dpreview.tsv as:
 *   name \t brand-slug \t date \t category \t mounts \t focal
 *
 *   npm run gear:import
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { GearItem } from "../lib/gear.ts";

const TSV = new URL("../data/dpreview.tsv", import.meta.url);
const STORE = new URL("../data/gear.json", import.meta.url);

/** Brand slugs as DPReview writes them, to how they should read. */
const BRANDS: Record<string, string> = {
  "om-system-olympus": "OM System",
  "samyang-rokinon": "Samyang",
  "laowa-venus-optics": "Laowa",
  "konica-minolta": "Konica Minolta",
  ttartisans: "TTArtisan",
  "7artisans": "7Artisans",
  dji: "DJI",
  gopro: "GoPro",
  zeiss: "Zeiss",
  lk: "Samyang",
};

/** Lens makers that build for other people's mounts. */
const INDEPENDENT = new Set([
  "sigma", "tamron", "samyang-rokinon", "viltrox", "laowa-venus-optics",
  "7artisans", "ttartisans", "zeiss", "voigtlander", "meike", "sirui",
  "thypoch", "lensbaby", "kenko", "tokina", "schneider", "hartblei",
  "irix", "nisi", "yongnuo", "astrhori", "brightin-star",
]);

function brandName(slug: string) {
  if (!slug) return "Other";
  if (BRANDS[slug]) return BRANDS[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const rows = readFileSync(TSV, "utf8").trim().split("\n");
const items: GearItem[] = [];

for (const row of rows) {
  const [name, brandSlug, date, category, mounts, focal] = row.split("\t");
  if (!name || !date) continue;

  items.push({
    name: name.trim(),
    brand: brandName(brandSlug?.trim() ?? ""),
    kind: category === "lenses" ? "lens" : "body",
    independent: INDEPENDENT.has(brandSlug?.trim() ?? ""),
    announcedAt: new Date(`${date}T00:00:00.000Z`).toISOString(),
    // A missing tele figure leaves "35-undefinedmm" in their data.
    focal: focal?.replace(/-undefined/, "").trim() || undefined,
    mounts: mounts ? mounts.split("|").filter(Boolean) : undefined,
    source: "dpreview",
  });
}

// Merge over anything already recorded, keeping entries found in coverage.
const existing = JSON.parse(readFileSync(STORE, "utf8")) as {
  note?: string;
  updated: string | null;
  items: GearItem[];
};
const merged = new Map<string, GearItem>();
for (const item of existing.items) merged.set(item.name.toLowerCase(), item);
for (const item of items) {
  const key = item.name.toLowerCase();
  // DPReview's record wins on facts, but keep a story link if we had one.
  const prior = merged.get(key);
  merged.set(key, prior?.storyId ? { ...item, storyId: prior.storyId } : item);
}

const out = [...merged.values()].sort((a, b) =>
  b.announcedAt.localeCompare(a.announcedAt)
);

writeFileSync(
  STORE,
  `${JSON.stringify(
    {
      note: "Cameras and lenses. Imported from DPReview's product database (npm run gear:import) and extended by this desk's own coverage (npm run gear:update). Dates are DPReview's record date, which tracks announcement for anything catalogued since 2023.",
      updated: new Date().toISOString(),
      items: out,
    },
    null,
    2
  )}\n`
);

const bodies = out.filter((i) => i.kind === "body").length;
const lenses = out.filter((i) => i.kind === "lens").length;
console.log(`imported ${items.length} from DPReview`);
console.log(`directory now: ${bodies} bodies, ${lenses} lenses (${out.length} total)`);
console.log(`brands: ${new Set(out.map((i) => i.brand)).size}`);
