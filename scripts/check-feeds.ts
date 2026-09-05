import Parser from "rss-parser";
import { sources, type Source } from "../lib/sources.ts";

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

const all = sources.map((s: Source) => ({ name: s.name, url: s.url, desk: s.category as string }));

const results = await Promise.all(
  all.map(async (source: { name: string; url: string; desk: string }) => {
    try {
      const feed = await parser.parseURL(source.url);
      const newest = feed.items?.[0];
      const count = feed.items?.length ?? 0;
      return {
        // A feed that parses but carries nothing is dead in the only sense
        // that matters — it contributes no stories and says nothing about it.
        ok: count > 0,
        desk: source.desk,
        name: source.name,
        count,
        newest: newest?.title?.replace(/\s+/g, " ").slice(0, 50) ?? "",
      };
    } catch (error) {
      return {
        ok: false,
        desk: source.desk,
        name: source.name,
        error: String(error).replace(/^Error:\s*/, "").slice(0, 50),
      };
    }
  })
);

for (const r of results) {
  console.log(
    r.ok
      ? `OK    ${r.desk.padEnd(9)} ${r.name.padEnd(20)} ${String(r.count).padStart(3)}  ${r.newest}`
      : `BROKEN ${r.desk.padEnd(9)} ${r.name.padEnd(20)} ${r.error ?? "feed parsed but carried no items"}`
  );
}

const broken = results.filter((r) => !r.ok);
console.log(`\n${results.length - broken.length}/${results.length} feeds healthy`);
if (broken.length > 0) process.exitCode = 1;
