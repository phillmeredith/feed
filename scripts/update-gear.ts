/**
 * Grows the camera directory.
 *
 * The desk only ever holds a rolling window of coverage, so a directory built
 * from it alone would forget everything older. This merges what's currently in
 * the feed into data/gear.json and never removes: run it regularly (a cron or
 * a scheduled action) and the catalogue deepens over time.
 *
 *   npm run gear:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gearFrom, type GearItem } from "../lib/gear.ts";

const STORE = new URL("../data/gear.json", import.meta.url);
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

interface Store {
  updated: string | null;
  items: GearItem[];
}

const store: Store = JSON.parse(readFileSync(STORE, "utf8"));

// Read the live desk rather than re-fetching every feed.
const html = (await (await fetch(`${BASE}/cameras`)).text()).replace(/<!-- -->/g, "");
const headlines = [
  ...new Set(
    [...html.matchAll(/class="(?:headline|font-body font-semibold)[^"]*"[^>]*>([^<]{15,140})</g)]
      .map((m) => m[1].trim())
  ),
];
const links = [...html.matchAll(/\/story\/([a-z0-9-]+)/g)].map((m) => m[1]);

const articles = headlines.map((headline, i) => ({
  id: links[i] ?? `unknown-${i}`,
  category: "cameras" as const,
  headline,
  dek: "",
  source: "",
  url: "",
  image: "",
  publishedAt: new Date().toISOString(),
}));

const found = gearFrom(articles);
const known = new Map(store.items.map((i) => [i.name.toLowerCase(), i]));

let added = 0;
for (const item of found) {
  const key = item.name.toLowerCase();
  if (known.has(key)) continue;
  known.set(key, item);
  added += 1;
  console.log(`  + ${item.kind.padEnd(4)} ${item.brand.padEnd(11)} ${item.name}`);
}

const items = [...known.values()].sort((a, b) =>
  b.announcedAt.localeCompare(a.announcedAt)
);
writeFileSync(STORE, `${JSON.stringify({ updated: new Date().toISOString(), items }, null, 2)}\n`);

console.log(`\n${added} new, ${items.length} in the directory`);
