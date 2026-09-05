/**
 * Audits the artwork each feed hands over: what the raw thumbnail measures,
 * and what it measures after `upgradeImage` asks the CDN for a bigger version.
 *
 *   node scripts/check-images.ts
 */
import Parser from "rss-parser";
import { sources, type Source } from "../lib/sources.ts";
import { upgradeImage } from "../lib/content.ts";

const SAMPLE_PER_FEED = 3;
const GOOD_WIDTH = 640;

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

type Item = Record<string, any>;

function extractImage(item: Item): string | null {
  const media = item.mediaContent?.$;
  if (media?.url && media.medium !== "audio") return media.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url) return item.enclosure.url;
  const html = item.contentEncoded || item.content || "";
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

/** Reads intrinsic dimensions straight from the file header. */
function dimensions(buf: Buffer): [number, number] | null {
  if (buf.length < 24) return null;

  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  // GIF
  if (buf.toString("ascii", 0, 3) === "GIF") {
    return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
  }
  // WebP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const format = buf.toString("ascii", 12, 16);
    if (format === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    if (format === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (format === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    return null;
  }
  // JPEG — walk the segment markers to the frame header.
  if (buf.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return [buf.readUInt16BE(offset + 7), buf.readUInt16BE(offset + 5)];
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  return null;
}

async function measure(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        Range: "bytes=0-131071",
      },
    });
    if (!res.ok && res.status !== 206) return { error: `HTTP ${res.status}` };
    const dims = dimensions(Buffer.from(await res.arrayBuffer()));
    return dims ? { width: dims[0], height: dims[1] } : { error: "unreadable" };
  } catch (e) {
    return { error: String(e).slice(0, 30) };
  }
}

const all = sources.map((s: Source) => ({ name: s.name, url: s.url, desk: s.category as string }));

const rows = await Promise.all(
  all.map(async (source: { name: string; url: string; desk: string }) => {
    let items: Item[] = [];
    try {
      items = ((await parser.parseURL(source.url)) as any).items ?? [];
    } catch {
      return { ...source, status: "feed error", samples: [] };
    }

    const samples = await Promise.all(
      items.slice(0, SAMPLE_PER_FEED).map(async (item) => {
        const raw = extractImage(item);
        if (!raw) return { none: true as const };
        const upgraded = upgradeImage(raw);
        const result = await measure(upgraded);
        return { raw, upgraded, changed: upgraded !== raw, ...result };
      })
    );

    return { ...source, status: "ok", samples };
  })
);

console.log("SOURCE                 DESK       WITH ART   TYPICAL SIZE   VERDICT");
console.log("-".repeat(76));

const poor: string[] = [];
const noArt: string[] = [];

for (const row of rows) {
  const withArt = row.samples.filter((s: any) => !s.none && s.width);
  const widths = withArt.map((s: any) => s.width as number);
  const median = widths.sort((a, b) => a - b)[Math.floor(widths.length / 2)];
  const upgraded = row.samples.some((s: any) => s.changed);

  let verdict: string;
  if (row.status === "feed error") verdict = "FEED ERROR";
  else if (withArt.length === 0) verdict = "no artwork";
  else if (median >= GOOD_WIDTH) verdict = upgraded ? `good (upgraded)` : "good";
  else verdict = `POOR (${median}px)`;

  const size = median ? `${median}px` : "—";
  console.log(
    `${row.name.padEnd(22)} ${row.desk.padEnd(10)} ${String(withArt.length)}/${row.samples.length}        ${size.padEnd(14)} ${verdict}`
  );

  if (verdict.startsWith("POOR")) poor.push(`${row.name} (${median}px)`);
  if (verdict === "no artwork") noArt.push(row.name);
}

console.log("\nSources still serving small images:", poor.length ? poor.join(", ") : "none");
console.log("Sources with no artwork at all:", noArt.length ? noArt.join(", ") : "none");
