/**
 * Classifies every feed by how much of the article it actually syndicates.
 * Sources that only publish a teaser can't be shown in full, so they don't
 * belong in the source list.
 *
 *   node scripts/check-fulltext.ts
 */
import Parser from "rss-parser";
import { sources, type Source } from "../lib/sources.ts";
import { sanitizeArticleHtml, wordCount } from "../lib/content.ts";

const FULL = 300;
const PARTIAL = 120;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  },
  customFields: { item: [["content:encoded", "contentEncoded"]] },
});

const all = sources.map((s: Source) => ({ name: s.name, url: s.url, desk: s.category as string }));

const rows = await Promise.all(
  all.map(async (source: { name: string; url: string; desk: string }) => {
    try {
      const feed = (await parser.parseURL(source.url)) as any;
      const counts: number[] = (feed.items ?? [])
        .slice(0, 4)
        .map((item: any) =>
          wordCount(sanitizeArticleHtml(item.contentEncoded || item.content || ""))
        );
      const median = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)] ?? 0;
      return { ...source, median };
    } catch {
      return { ...source, median: -1 };
    }
  })
);

const verdict = (n: number) =>
  n < 0 ? "FEED ERROR" : n >= FULL ? "FULL TEXT" : n >= PARTIAL ? "partial" : "SUMMARY ONLY";

console.log("SOURCE                 DESK        MEDIAN WORDS   VERDICT");
console.log("-".repeat(62));
for (const r of rows.sort((a: { median: number }, b: { median: number }) => b.median - a.median)) {
  console.log(
    `${r.name.padEnd(22)} ${r.desk.padEnd(11)} ${String(r.median).padStart(6)}         ${verdict(r.median)}`
  );
}

const keep = rows.filter((r) => r.median >= FULL).map((r) => r.name);
const drop = rows.filter((r) => r.median >= 0 && r.median < PARTIAL).map((r) => r.name);
console.log(`\nFull text (${keep.length}): ${keep.join(", ")}`);
console.log(`\nSummary only (${drop.length}): ${drop.join(", ")}`);
