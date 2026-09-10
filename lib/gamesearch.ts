import { allGames, isCalm, obscurity, type Game } from "./games";

/**
 * The directory's own query language, such as it is.
 *
 * Everything lives in the URL rather than in component state, which is the
 * same decision the desk tabs made and for the same reasons: a filtered view
 * is a thing you can send someone, the back button behaves, and a reader with
 * no JavaScript still gets a working directory. The cost is a round trip per
 * change, which for a page nobody is going to filter forty times is nothing.
 */

export const SORTS = {
  calm: "Calmest first",
  gems: "Buried gems first",
  regard: "Best liked first",
  newest: "Newest first",
  oldest: "Oldest first",
  name: "A to Z",
} as const;

export type Sort = keyof typeof SORTS;

export interface Query {
  q?: string;
  platform?: string;
  tag?: string;
  sort?: Sort;
  calm?: boolean;
}

export function parseQuery(params: Record<string, string | string[] | undefined>): Query {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const sort = one("sort");
  return {
    q: one("q"),
    platform: one("platform"),
    tag: one("tag"),
    sort: sort && sort in SORTS ? (sort as Sort) : undefined,
    calm: one("calm") === "1",
  };
}

/** The query as a query string, so a filter chip can drop one term. */
export function toSearch(query: Query): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.platform) p.set("platform", query.platform);
  if (query.tag) p.set("tag", query.tag);
  if (query.sort) p.set("sort", query.sort);
  if (query.calm) p.set("calm", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function runQuery(query: Query): Game[] {
  const needle = query.q?.toLowerCase();
  let games = allGames();

  if (needle) {
    /* Name, developer and tags. Searching the description as well sounds
       generous and is not: every third game's copy contains the word
       "adventure", and the results stop meaning anything. */
    games = games.filter(
      (g) =>
        g.name.toLowerCase().includes(needle) ||
        g.developer.toLowerCase().includes(needle) ||
        g.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }
  if (query.platform) {
    games = games.filter((g) => g.platforms.includes(query.platform!));
  }
  if (query.tag) {
    const tag = query.tag.toLowerCase();
    games = games.filter((g) => g.tags.some((t) => t.toLowerCase() === tag));
  }
  if (query.calm) games = games.filter(isCalm);

  const sort = query.sort ?? "calm";
  const by: Record<Sort, (a: Game, b: Game) => number> = {
    calm: (a, b) => b.calm - a.calm || (b.regard ?? 0) - (a.regard ?? 0),
    gems: (a, b) => obscurity(b) - obscurity(a),
    regard: (a, b) => (b.regard ?? 0) - (a.regard ?? 0) || b.reviews - a.reviews,
    newest: (a, b) => b.released.localeCompare(a.released),
    oldest: (a, b) => a.released.localeCompare(b.released),
    name: (a, b) => a.name.localeCompare(b.name),
  };

  return [...games].sort(by[sort]);
}
