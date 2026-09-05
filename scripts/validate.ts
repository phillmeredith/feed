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
import known from "../data/known-unreadable.json" with { type: "json" };

const SAMPLES = 4;
const MIN_WORDS = 120;

/*
 * Publishers rate-limit. Sampling a source's articles back-to-back made Inside
 * Climate News answer 403 to all of them, which looked like a dead source and
 * was really an impatient checker — the same feed reads fine at reading pace.
 */
const PACE_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/*
 * A feed passes if most of what it files can be read, not all of it. Rumour
 * blogs post the occasional ninety-word "stay tuned" note, which the extractor
 * rightly discards as noise; that says nothing about whether the source can be
 * read when it has something to say.
 */
const PASS_RATIO = 0.5;

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
    let first = true;
    for (const item of items.slice(0, SAMPLES)) {
      if (!first) await sleep(PACE_MS);
      first = false;
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

    const readable = counts.filter((c) => c >= MIN_WORDS).length;
    const ok = counts.length > 0 && readable / counts.length >= PASS_RATIO;
    return {
      source,
      ok,
      note: ok ? "" : `only ${readable}/${counts.length} items readable`,
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

/*
 * Known failures are listed with a reason and a date, so CI can fail on a new
 * one without failing on the ones already being tracked. A rule nobody can
 * merge past is a rule that gets deleted; a rule that only catches regressions
 * is one that survives.
 */
const excused = new Set(known.sources.map((s) => s.name));
const failed = results.filter((r) => !r.ok);
const regressions = failed.filter((r) => !excused.has(r.source.name));
const stillKnown = failed.filter((r) => excused.has(r.source.name));

if (stillKnown.length) {
  console.log(`\n${stillKnown.length} known failure(s), already tracked in data/known-unreadable.json:`);
  for (const r of stillKnown) {
    const entry = known.sources.find((s) => s.name === r.source.name);
    console.log(`  ${r.source.name} — since ${entry?.since}: ${entry?.reason}`);
  }
}

const fixed = known.sources.filter(
  (s) => !failed.some((r) => r.source.name === s.name)
);
if (fixed.length) {
  console.log(`\n${fixed.length} source(s) now readable — remove from data/known-unreadable.json: ${fixed.map((s) => s.name).join(", ")}`);
}

console.log(
  regressions.length
    ? `\nREGRESSION — ${regressions.length} source(s) newly break the full-text rule: ${regressions.map((r) => r.source.name).join(", ")}`
    : `\n${results.length - failed.length}/${results.length} sources readable in full, no regressions.`
);
process.exitCode = regressions.length ? 1 : 0;
