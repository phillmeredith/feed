/**
 * Adds whatever the site is currently publishing to the archive.
 *
 * Feeds carry a rolling window, so this is what stops the desks forgetting.
 * Run it regularly — every run only adds.
 *
 *   npm run dev            # in another shell
 *   npm run archive:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { ArchivedArticle } from "../lib/archive.ts";

const STORE = new URL("../data/archive.json", import.meta.url);
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  note: string;
  updated: string | null;
  items: ArchivedArticle[];
};

const res = await fetch(`${BASE}/api/snapshot`);
if (!res.ok) {
  console.error(`snapshot unavailable (HTTP ${res.status}) — is the dev server running?`);
  process.exit(1);
}

const { items } = (await res.json()) as { items: ArchivedArticle[] };
const known = new Map(store.items.map((a) => [a.id, a]));

let added = 0;
const byDesk: Record<string, number> = {};
for (const item of items) {
  if (known.has(item.id)) continue;
  known.set(item.id, item);
  added += 1;
  byDesk[item.category] = (byDesk[item.category] ?? 0) + 1;
}

const merged = [...known.values()].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt)
);

writeFileSync(
  STORE,
  `${JSON.stringify({ ...store, updated: new Date().toISOString(), items: merged }, null, 2)}\n`
);

console.log(`snapshot: ${items.length} live, ${added} new`);
if (added) {
  console.log(
    Object.entries(byDesk)
      .map(([d, n]) => `  ${d}: +${n}`)
      .join("\n")
  );
}
console.log(`archive now holds ${merged.length} stories`);
