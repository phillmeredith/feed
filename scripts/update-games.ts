/**
 * Builds the games directory from three keyless sources.
 *
 * Wikidata knows which consoles a game came out on and carries Steam's own
 * application id (P1733), which is what makes the join exact rather than a
 * guess at matching titles. Steam's storefront gives the genres, the age
 * descriptors and the copy. SteamSpy gives the player tags and the review
 * split — and the tags are the whole point, because "Relaxing" and "Cozy"
 * are not genres and are precisely what somebody hunting a quiet evening is
 * looking for.
 *
 * Steam rate-limits hard, so this fills in over successive runs: the store is
 * read back, anything already known is kept, and only a capped number of new
 * titles are fetched each time. A day's run adds a few hundred; the daily
 * workflow does the rest.
 *
 *   npm run games:update            fill in the next batch
 *   npm run games:update -- --all   keep going until the list is exhausted
 */
import { writeFileSync, readFileSync } from "node:fs";
import type { Game } from "../lib/games.ts";
import { calmScore } from "../lib/games.ts";

const STORE = new URL("../data/games.json", import.meta.url);
const UA = "TheDispatch/1.0 (games directory; +https://github.com/phillmeredith/feed)";
const SOURCE = "Wikidata · Steam · SteamSpy";

/** Steam tolerates roughly this without complaining. */
const GAP_MS = 1500;
const BATCH = Number(process.env.GAMES_BATCH ?? 220);
const ALL = process.argv.includes("--all");

const PLATFORMS: Record<string, string> = {
  Q19610114: "Switch",
  Q122761124: "Switch 2",
  Q13361286: "Xbox One",
  Q98973368: "Xbox Series",
  Q5014725: "PlayStation 4",
  Q63184502: "PlayStation 5",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

/** Every console release since 2020 that Wikidata can tie to a Steam id. */
async function fromWikidata() {
  const values = Object.keys(PLATFORMS).map((q) => `wd:${q}`).join(" ");
  const query = `
    SELECT ?steam ?name (MIN(?date) AS ?first)
           (GROUP_CONCAT(DISTINCT ?plat; separator="|") AS ?plats) WHERE {
      ?game wdt:P31 wd:Q7889 ; wdt:P1733 ?steam ; wdt:P577 ?date ;
            wdt:P400 ?platform ; rdfs:label ?name .
      FILTER(LANG(?name) = "en")
      FILTER(?date >= "2013-01-01T00:00:00Z"^^xsd:dateTime)
      VALUES ?platform { ${values} }
      BIND(STRAFTER(STR(?platform), "entity/") AS ?plat)
    } GROUP BY ?steam ?name`;

  const res = await fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { accept: "application/sparql-results+json", "user-agent": UA } }
  );
  if (!res.ok) throw new Error(`Wikidata → HTTP ${res.status}`);
  const body = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };

  return body.results.bindings
    .map((r) => ({
      id: Number(r.steam.value),
      name: r.name.value,
      released: r.first.value.slice(0, 10),
      platforms: r.plats.value
        .split("|")
        .map((q) => PLATFORMS[q])
        .filter(Boolean)
        .sort(),
    }))
    .filter((g) => Number.isFinite(g.id) && g.id > 0);
}

/** SteamSpy publishes ownership as a band; take the middle of it. */
function ownersOf(band: string) {
  const [lo, hi] = band.split("..").map((n) => Number(n.replace(/[^0-9]/g, "")));
  if (!Number.isFinite(lo)) return 0;
  return Number.isFinite(hi) ? Math.round((lo + hi) / 2) : lo;
}

async function enrich(seed: {
  id: number;
  name: string;
  released: string;
  platforms: string[];
}): Promise<Game | null> {
  const [storeRes, spyRes] = await Promise.all([
    fetch(
      `https://store.steampowered.com/api/appdetails?appids=${seed.id}&l=english`,
      { headers: { "user-agent": UA } }
    ).catch(() => null),
    fetch(`https://steamspy.com/api.php?request=appdetails&appid=${seed.id}`, {
      headers: { "user-agent": UA },
    }).catch(() => null),
  ]);

  if (!storeRes?.ok) return null;
  const storeBody = (await storeRes.json()) as Record<
    string,
    { success: boolean; data?: Record<string, unknown> }
  >;
  const d = storeBody[String(seed.id)]?.data;
  if (!d) return null;
  // Downloadable content and soundtracks are not games and clutter a directory.
  if (d.type !== "game") return null;

  const spy = spyRes?.ok
    ? ((await spyRes.json()) as Record<string, unknown>)
    : {};

  const tagBag = (spy.tags as Record<string, number> | undefined) ?? {};
  const tags = Object.entries(tagBag)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([t]) => t);

  const positive = Number(spy.positive ?? 0);
  const negative = Number(spy.negative ?? 0);
  const reviews = positive + negative;

  const ratings = (d.ratings ?? {}) as Record<string, { descriptors?: string }>;
  const descriptors = [
    ...new Set(
      Object.values(ratings)
        .flatMap((r) => (r.descriptors ?? "").split(/\r?\n/))
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];

  return {
    id: seed.id,
    slug: slugify(seed.name),
    name: (d.name as string) || seed.name,
    released: seed.released,
    platforms: seed.platforms,
    genres: ((d.genres ?? []) as { description: string }[]).map(
      (g) => g.description
    ),
    tags,
    descriptors,
    calm: calmScore(tags),
    regard: reviews >= 20 ? Math.round((positive / reviews) * 100) : null,
    reviews,
    owners: ownersOf(String(spy.owners ?? "")),
    short: ((d.short_description as string) ?? "").slice(0, 400),
    shot:
      ((d.screenshots ?? []) as { path_thumbnail: string }[])[0]?.path_thumbnail ??
      "",
    image: (d.header_image as string) ?? "",
    developer: (((d.developers ?? []) as string[])[0] ?? "").slice(0, 60),
  };
}

// --- run ------------------------------------------------------------------

const existing: Game[] = (() => {
  try {
    return (JSON.parse(readFileSync(STORE, "utf8")) as { games: Game[] }).games;
  } catch {
    return [];
  }
})();
const known = new Map(existing.map((g) => [g.id, g]));

console.log("Asking Wikidata which console games have a Steam id…");
const seeds = await fromWikidata();
console.log(`  ${seeds.length} console releases since 2013`);

/*
 * Released games, newest first.
 *
 * Newest-first on its own put the whole first run into titles that have not
 * shipped: SteamSpy has no players to have tagged an unreleased game, so
 * twenty-five records came back with no tags, no reviews and a calm score of
 * zero — which is not "this game is tense", it is "nobody has played it".
 * Announced games belong on a release calendar; a directory you search for
 * something to play tonight wants the ones that exist.
 */
/*
 * Spread across the years rather than worked through in order.
 *
 * Oldest-first was right about one thing and wrong about the rest. Right that
 * a tag needs players before it exists, so the newest releases come back
 * blank — not "this game is tense" but "nobody has played it". Wrong that the
 * fix is to start in 2013 and walk forwards: after a full run the directory
 * held eight hundred games and every one of them was from 2013 to 2015, so it
 * read as an archive rather than a directory and had none of the games
 * anybody would name — no Minecraft, no Tony Hawk, no Stardew.
 *
 * So the queue is dealt round-robin through the years. Every run takes a
 * slice of each, and the directory is representative of the whole period at
 * every stage of filling rather than only at the end of it.
 */
const settled = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
const byYear = new Map<string, typeof seeds>();
for (const s of seeds) {
  if (known.has(s.id) || s.released > settled) continue;
  const year = s.released.slice(0, 4);
  byYear.set(year, [...(byYear.get(year) ?? []), s]);
}
/*
 * Within a year, the widest releases first.
 *
 * Alphabetical was arbitrary and it showed: two thousand games in, the
 * directory had ABZU and no Stardew Valley, because S is late in the
 * alphabet. The number of consoles a game shipped on is the one signal
 * available before anything is fetched, and it is a decent proxy for whether
 * anybody has heard of it — a game on five platforms had a publisher behind
 * it, a game on one usually did not. Both belong here; the recognisable ones
 * should not arrive ninth.
 */
for (const list of byYear.values()) {
  list.sort(
    (a, b) => b.platforms.length - a.platforms.length || a.name.localeCompare(b.name)
  );
}
const years = [...byYear.keys()].sort();
const pending: typeof seeds = [];
for (let i = 0; pending.length < 100_000; i++) {
  const round = years.map((y) => byYear.get(y)![i]).filter(Boolean);
  if (round.length === 0) break;
  pending.push(...round);
}

const take = ALL ? pending : pending.slice(0, BATCH);
console.log(`  ${known.size} already known, ${pending.length} to go — fetching ${take.length}`);

let added = 0;
let skipped = 0;
for (const [i, seed] of take.entries()) {
  try {
    const game = await enrich(seed);
    if (game && game.tags.length === 0) {
      /* Shipped but unplayed, or SteamSpy has not caught up. Left out of the
         store entirely so a later run picks it up once it has players. */
      skipped++;
      if (skipped <= 5) console.log(`    – ${seed.name}: no tags yet`);
    } else if (game) {
      known.set(game.id, game);
      added++;
    } else {
      skipped++;
      if (skipped <= 5) console.log(`    – ${seed.name}: Steam has no game here`);
      // Remember the refusal so tomorrow's run does not spend its budget on
      // the same soundtrack entry again.
      known.set(seed.id, { ...seed, id: seed.id, slug: "", name: seed.name,
        genres: [], tags: [], descriptors: [], calm: 0, regard: null,
        reviews: 0, owners: 0, short: "", shot: "", image: "",
        developer: "" } as Game);
    }
  } catch (error) {
    console.log(`  ! ${seed.name}: ${(error as Error).message}`);
  }
  if (i % 50 === 49) console.log(`  … ${i + 1}/${take.length}`);
  await sleep(GAP_MS);
}

// Entries with no slug are the ones Steam declined; they are kept as markers
// and dropped on the way out.
const games = [...known.values()]
  .filter((g) => g.slug)
  .sort((a, b) => b.released.localeCompare(a.released));

writeFileSync(
  STORE,
  `${JSON.stringify({ updated: new Date().toISOString(), source: SOURCE, games }, null, 2)}\n`
);

const calm = games.filter((g) => g.calm >= 25).length;
console.log(
  `\n${games.length} games in the directory (+${added} this run, ${skipped} not games) · ${calm} calm`
);
