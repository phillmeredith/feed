/**
 * Pulls recent filings from Google Patents into data/patents.json.
 *
 * Run on a schedule rather than per request: Google rate-limits bursts with a
 * 503, and a page render that fires six queries would trip it. Requests are
 * spaced out here, and the store never loses what it already has.
 *
 *   npm run patents:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import { WATCHED, filingsFor, type PatentFiling } from "../lib/patents.ts";
import type { CategorySlug } from "../lib/types.ts";

const STORE = new URL("../data/patents.json", import.meta.url);
const GAP_MS = Number(process.env.PATENT_GAP_MS ?? 4000);
const LOOKBACK_DAYS = 400;

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  note: string;
  updated: string | null;
  items: PatentFiling[];
};

const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)
  .toISOString()
  .slice(0, 10)
  .replace(/-/g, "");

const known = new Map(store.items.map((i) => [i.id, i]));
let added = 0;
let blocked = 0;

for (const [desk, companies] of Object.entries(WATCHED)) {
  for (const company of companies ?? []) {
    const filings = await filingsFor(company, since, desk as CategorySlug);
    if (filings.length === 0) {
      blocked += 1;
      console.log(`  ${desk.padEnd(9)} ${company.padEnd(20)} nothing returned`);
    } else {
      let fresh = 0;
      for (const f of filings) {
        if (known.has(f.id)) continue;
        known.set(f.id, f);
        fresh += 1;
      }
      added += fresh;
      console.log(`  ${desk.padEnd(9)} ${company.padEnd(20)} ${filings.length} found, ${fresh} new`);
    }
    await new Promise((r) => setTimeout(r, GAP_MS));
  }
}

const items = [...known.values()].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
writeFileSync(STORE, `${JSON.stringify({ ...store, updated: new Date().toISOString(), items }, null, 2)}\n`);

console.log(`\n${added} new, ${items.length} filings stored`);
if (blocked) console.log(`${blocked} queries returned nothing (rate limit or no filings) — re-run later`);
