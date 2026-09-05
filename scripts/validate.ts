/**
 * Enforces the site's hard rule: every story must be readable in full on The
 * Dispatch. For each source this samples recent items and checks the pipeline
 * produces a complete article — from the feed where it syndicates one, or by
 * reading the article page where it doesn't.
 *
 * Exits non-zero if any source can't satisfy the rule.
 *
 *   npm run validate
 */
import Parser from "rss-parser";
import { sources, type Source } from "../lib/sources.ts";
import { sanitizeArticleHtml, wordCount } from "../lib/content.ts";
import { extractArticle } from "../lib/extract.ts";

const SAMPLES = 3;
const MIN_WORDS = 120;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  },
  customFields: { item: [["content:encoded", "contentEncoded"]] },
});

const results = await Promise.all(
  sources.map(async (source: Source) => {
    let items: any[] = [];
    try {
      items = ((await parser.parseURL(source.url)) as any).items ?? [];
    } catch (e) {
      return { source, ok: false, note: `feed error: ${String(e).slice(0, 30)}`, counts: [] };
    }
    if (items.length === 0) return { source, ok: false, note: "feed empty", counts: [] };

    const counts: number[] = [];
    for (const item of items.slice(0, SAMPLES)) {
      const fromFeed = wordCount(
        sanitizeArticleHtml(item.contentEncoded || item.content || "")
      );
      if (fromFeed >= MIN_WORDS) {
        counts.push(fromFeed);
        continue;
      }
      const extracted = item.link ? await extractArticle(item.link) : null;
      counts.push(extracted?.words ?? 0);
    }

    const failures = counts.filter((c) => c < MIN_WORDS).length;
    return {
      source,
      ok: failures === 0,
      note: failures ? `${failures}/${counts.length} items unreadable` : "",
      counts,
    };
  })
);

console.log("SOURCE                 DESK        WORDS PER SAMPLE   STATUS");
console.log("-".repeat(70));

for (const r of results) {
  const words = r.counts.map((c) => String(c).padStart(4)).join(" ") || "   —";
  console.log(
    `${r.source.name.padEnd(22)} ${r.source.category.padEnd(11)} ${words.padEnd(18)} ${r.ok ? "ok" : `FAIL — ${r.note}`}`
  );
}

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length
    ? `\n${failed.length} source(s) break the full-text rule: ${failed.map((r) => r.source.name).join(", ")}`
    : `\nAll ${results.length} sources readable in full.`
);
process.exitCode = failed.length ? 1 : 0;
