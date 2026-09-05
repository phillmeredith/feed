/**
 * Finds the official highlights for every session on record.
 *
 * The rights holders post these themselves, under titles that barely vary
 * from one weekend to the next. YouTube's results page carries the whole
 * result set in a JSON blob, so a search plus a strict filter — right
 * channel, right title shape, right event named in the title — resolves a
 * session to a video without an API key or a guess.
 *
 * Anything already resolved is left alone: this is additive, and a run that
 * finds nothing changes nothing.
 *
 *   npm run highlights:update
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Highlight, HighlightKind } from "../lib/highlights.ts";

const STORE = new URL("../data/highlights.json", import.meta.url);
const F1 = new URL("../data/f1.json", import.meta.url);
const GOLF = new URL("../data/golf.json", import.meta.url);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Only these channels are the rights holder; anything else is a reupload. */
const OFFICIAL: Map<string, string[]> = new Map([
  ["f1", ["FORMULA 1"]],
  ["golf", ["PGA Tour"]],
]);

/**
 * The majors are not the PGA Tour's to post.
 *
 * Each is run by a different body and each puts its highlights on its own
 * channel, under its own house style — the R&A doesn't write the year into
 * an Open title at all, it writes the number of the championship. So the four
 * get an explicit entry rather than a rule, and a single-event channel does
 * the work that a title match would otherwise have to.
 */
const GOLF_MAJORS: Record<
  string,
  { channel: string; title: RegExp; needsYear: boolean }
> = {
  "Masters Tournament": {
    channel: "The Masters",
    title: /final round|highlights/i,
    needsYear: true,
  },
  "PGA Championship": {
    channel: "PGA Championships",
    title: /round 4 highlights|final round highlights/i,
    needsYear: true,
  },
  "U.S. Open": {
    channel: "United States Golf Association (USGA)",
    title: /u\.?s\.? open highlights.*final round/i,
    needsYear: true,
  },
  "The Open": {
    channel: "The R&A",
    // The R&A numbers its championships instead of dating them.
    title: /final round highlights/i,
    needsYear: false,
  },
};

interface Found {
  videoId: string;
  channel: string;
  title: string;
}

async function search(query: string): Promise<Found[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const blob = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!blob) return [];

  const found: Found[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const video = obj.videoRenderer as Record<string, unknown> | undefined;
    if (video?.videoId) {
      const runs =
        ((video.title as Record<string, unknown>)?.runs as { text: string }[]) ??
        [];
      const owner =
        ((video.ownerText as Record<string, unknown>)?.runs as {
          text: string;
        }[]) ?? [];
      found.push({
        videoId: String(video.videoId),
        title: runs.map((r) => r.text).join(""),
        channel: owner[0]?.text ?? "",
      });
    }
    Object.values(obj).forEach(walk);
  };
  walk(JSON.parse(blob));
  return found;
}

function titleYears(title: string): string[] {
  return title.match(/\b(19|20)\d{2}\b/g) ?? [];
}

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * A title has to name the event, name the session, carry the right year and
 * come from the rights holder.
 *
 * The event has to appear as a phrase, not as a bag of words. Golf is the
 * reason: matching "PGA Championship" on its individual words happily accepts
 * "TOUR Championship", which is a different tournament with a different
 * winner. And the year has to be checked, because these channels post the
 * same event every season under the same title.
 */
function pick(
  results: Found[],
  sport: string,
  event: string,
  session: RegExp,
  year: string
): Found | null {
  const channels = OFFICIAL.get(sport) ?? [];
  const phrase = normalise(event.replace(/\b(19|20)\d{2}\b/g, ""));

  return (
    results.find((r) => {
      if (!channels.some((c) => normalise(c) === normalise(r.channel)))
        return false;
      if (!session.test(r.title)) return false;

      const title = normalise(r.title);
      if (!title.includes(phrase)) return false;

      // These channels repost the same event yearly under the same title.
      const years: string[] = r.title.match(/\b(19|20)\d{2}\b/g) ?? [];
      return years.length === 0 ? false : years.includes(year);
    }) ?? null
  );
}

const store = JSON.parse(readFileSync(STORE, "utf8")) as {
  note: string;
  updated: string | null;
  items: Highlight[];
};
const have = new Set(store.items.map((h) => `${h.key}|${h.kind}`));
let added = 0;

function record(key: string, kind: HighlightKind, hit: Found | null) {
  if (!hit || have.has(`${key}|${kind}`)) return;
  store.items.push({
    key,
    kind,
    videoId: hit.videoId,
    title: hit.title,
    channel: hit.channel,
  });
  have.add(`${key}|${kind}`);
  added += 1;
  console.log(`  + ${key.padEnd(16)} ${kind.padEnd(18)} ${hit.title}`);
}

// --- Formula 1 -------------------------------------------------------------
const f1 = JSON.parse(readFileSync(F1, "utf8")) as {
  season: string;
  races: { round: number; name: string; results?: unknown[] }[];
};

const F1_SESSIONS: [HighlightKind, RegExp, string][] = [
  ["race", /^race highlights/i, "Race Highlights"],
  ["qualifying", /^qualifying highlights/i, "Qualifying Highlights"],
  ["sprint", /^sprint highlights/i, "Sprint Highlights"],
  ["sprint-qualifying", /^sprint qualifying highlights/i, "Sprint Qualifying Highlights"],
];

for (const race of f1.races) {
  // A race that hasn't run has no highlights to find.
  if (!race.results?.length) continue;
  const key = `f1:${f1.season}:${race.round}`;

  // Sprints are the exception, so they're only looked for once the weekend's
  // main sessions are already known — one search instead of four per round.
  const wanted = F1_SESSIONS.filter(([kind]) => !have.has(`${key}|${kind}`));
  if (wanted.length === 0) continue;

  const event = `${f1.season} ${race.name}`;
  let results: Found[];
  try {
    results = await search(`Formula 1 highlights ${event}`);
  } catch (error) {
    console.log(`  ! ${event}: ${(error as Error).message}`);
    continue;
  }

  for (const [kind, session] of wanted) {
    record(key, kind, pick(results, "f1", race.name, session, f1.season));
  }
  await new Promise((r) => setTimeout(r, 1200));
}

// --- Golf ------------------------------------------------------------------
let golf: {
  season: string;
  events: { id: string; name: string; status: string; major: boolean; endDate: string }[];
} | null = null;
try {
  golf = JSON.parse(readFileSync(GOLF, "utf8"));
} catch {
  console.log("  (no golf store yet)");
}

/*
 * Not every week gets an official highlights package, and searching for one
 * that was never posted costs a request to find nothing. The majors always
 * have one, and so does whatever was played recently; the rest of the season
 * is left alone.
 */
const played = (golf?.events ?? [])
  .filter((e) => e.status === "Final")
  .sort((a, b) => b.endDate.localeCompare(a.endDate));
const wantedGolf = [
  ...played.filter((e) => e.major),
  ...played.slice(0, 4),
];

for (const event of new Set(wantedGolf)) {
  if (event.status !== "Final") continue;
  const key = `golf:${event.id}`;
  if (have.has(`${key}|final-round`)) continue;

  let results: Found[];
  try {
    results = await search(
      `${event.name} ${golf?.season ?? ""} final round highlights golf`
    );
  } catch (error) {
    console.log(`  ! ${event.name}: ${(error as Error).message}`);
    continue;
  }
  const major = GOLF_MAJORS[event.name];
  record(
    key,
    "final-round",
    major
      ? results.find(
          (r) =>
            normalise(r.channel) === normalise(major.channel) &&
            major.title.test(r.title) &&
            (!major.needsYear || titleYears(r.title).includes(golf?.season ?? ""))
        ) ?? null
      : pick(results, "golf", event.name, /highlights/i, golf?.season ?? "")
  );
  await new Promise((r) => setTimeout(r, 1200));
}

writeFileSync(
  STORE,
  `${JSON.stringify({ ...store, updated: new Date().toISOString() }, null, 2)}\n`
);
console.log(`\n${added} new, ${store.items.length} recorded`);
