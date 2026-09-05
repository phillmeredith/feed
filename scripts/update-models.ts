/**
 * Grows the closed-model release list.
 *
 * Labs' feeds drop a release within days of announcing it, so a table built
 * only from live coverage forgets GPT-6 Astra and Gemini 3.8 Flash a week
 * later. This merges what today's coverage shows into data/models.json and
 * never removes.
 *
 *   npm run models:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import { modelsFromCoverage, type ModelRelease } from "../lib/models.ts";

const STORE = new URL("../data/models.json", import.meta.url);
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  note: string;
  updated: string | null;
  items: ModelRelease[];
};

const html = (await (await fetch(`${BASE}/ai`)).text()).replace(/<!-- -->/g, "");
const headlines = [
  ...new Set(
    [...html.matchAll(/class="(?:headline|font-body font-semibold)[^"]*"[^>]*>([^<]{15,140})</g)]
      .map((m) => m[1].trim())
  ),
];
const ids = [...html.matchAll(/\/story\/([a-z0-9-]+)/g)].map((m) => m[1]);

const found = modelsFromCoverage(
  headlines.map((headline, i) => ({
    id: ids[i] ?? `unknown-${i}`,
    category: "ai",
    headline,
    publishedAt: new Date().toISOString(),
  }))
);

const known = new Map(store.items.map((i) => [i.name.toLowerCase(), i]));
let added = 0;
for (const model of found) {
  if (known.has(model.name.toLowerCase())) continue;
  known.set(model.name.toLowerCase(), model);
  added += 1;
  console.log(`  + ${model.lab.padEnd(16)} ${model.name}`);
}

const items = [...known.values()].sort((a, b) =>
  b.releasedAt.localeCompare(a.releasedAt)
);
writeFileSync(
  STORE,
  `${JSON.stringify({ ...store, updated: new Date().toISOString(), items }, null, 2)}\n`
);
console.log(`\n${added} new, ${items.length} recorded`);
