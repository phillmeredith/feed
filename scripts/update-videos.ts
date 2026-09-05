/**
 * Grows the video coverage store.
 *
 * YouTube's per-channel Atom feed carries the last fifteen videos and no
 * further. A review that scrolls off is unrecoverable without an API key, so
 * this merges what each channel currently shows into data/videos.json and
 * never removes. Run it on the refresh cycle.
 *
 *   npm run videos:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CHANNELS, type Video } from "../lib/video.ts";

const STORE = new URL("../data/videos.json", import.meta.url);

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  note: string;
  updated: string | null;
  items: Video[];
};

const known = new Map(store.items.map((v) => [v.id, v]));
let added = 0;
let refreshed = 0;

for (const channel of CHANNELS) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
  let xml: string;
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.log(`  ! ${channel.name}: HTTP ${res.status}`);
      continue;
    }
    xml = await res.text();
  } catch (error) {
    console.log(`  ! ${channel.name}: ${(error as Error).message}`);
    continue;
  }

  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const id = entry.match(/<yt:videoId>([^<]+)</)?.[1];
    const title = entry.match(/<media:title>([^<]*)</)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)</)?.[1];
    if (!id || !title || !publishedAt) continue;

    // A short is a different thing from a review, and the link says which.
    if (/\/shorts\//.test(entry)) continue;

    const views = Number(entry.match(/views="(\d+)"/)?.[1] ?? 0);

    const existing = known.get(id);
    if (existing) {
      // View counts move; everything else about a video does not.
      if (views > existing.views) {
        existing.views = views;
        refreshed += 1;
      }
      continue;
    }

    known.set(id, {
      id,
      title: decode(title),
      channel: channel.name,
      beat: channel.beat,
      publishedAt,
      views,
    });
    added += 1;
    console.log(`  + ${channel.name.padEnd(18)} ${decode(title)}`);
  }
}

function decode(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const items = [...known.values()].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt)
);
writeFileSync(
  STORE,
  `${JSON.stringify({ ...store, updated: new Date().toISOString(), items }, null, 2)}\n`
);
console.log(`\n${added} new, ${refreshed} view counts moved, ${items.length} recorded`);
