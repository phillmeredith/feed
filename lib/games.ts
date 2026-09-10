import store from "../data/games.json" with { type: "json" };

/**
 * A games directory built to answer the question a storefront will not.
 *
 * Every shop ranks by what sells, which is why a search for something to
 * play on a wet Sunday returns the same twelve war games it returned last
 * month, and why Unravel and A Short Hike are four screens down under things
 * nobody asked for. Popularity is a fine signal if you want what everyone
 * else has and a useless one otherwise.
 *
 * So this ranks on three things a shop does not put together: how calm a game
 * is, how well the people who played it rated it, and how few of them there
 * were. High regard and low sales is the definition of the thing that gets
 * buried.
 */

export interface Game {
  /** Steam's application id — the join key across every source here. */
  id: number;
  slug: string;
  name: string;
  released: string;
  /** Console and desktop platforms, from Wikidata. */
  platforms: string[];
  /** Steam's own genre list. */
  genres: string[];
  /** Player-written tags, most-voted first. The useful ones. */
  tags: string[];
  /** Age rating body descriptors, empty where a game carries none. */
  descriptors: string[];
  /** −100 (relentless) to 100 (becalmed). See `CALM` and `INTENSE`. */
  calm: number;
  /** Share of reviews that are positive, 0–100, or null where too few. */
  regard: number | null;
  reviews: number;
  /** Rough owners, from SteamSpy's band. The number to rank *against*. */
  owners: number;
  short: string;
  /**
   * A gameplay screenshot.
   *
   * Not Steam's header image, which is what this used and which is a 460×215
   * marketing capsule with the title lettered across it — cropped to a card
   * it cut the words in half and showed no game. A screenshot is the game.
   */
  shot: string;
  /** The capsule, kept only for the handful of games with no screenshots. */
  image: string;
  developer: string;
}

interface Store {
  updated: string;
  source: string;
  games: Game[];
}

const data = store as Store;

export function allGames(): Game[] {
  return data.games;
}

export function gamesUpdated() {
  return data.updated;
}

export function gameBySlug(slug: string): Game | null {
  return data.games.find((g) => g.slug === slug) ?? null;
}

/*
 * The two lists the calm score is built from.
 *
 * Player tags rather than genres, because a genre says what a game is and a
 * tag says what it is like — "Relaxing" and "Cozy" are not genres and are
 * exactly what somebody looking for a quiet evening is searching for. Both
 * lists are deliberately broad: the score is a sorting aid, not a verdict,
 * and one tag either way should not move a game far.
 */
export const CALM = [
  "relaxing", "cozy", "cosy", "wholesome", "cute", "casual", "atmospheric",
  "exploration", "walking simulator", "farming sim", "life sim", "puzzle",
  "point & click", "hidden object", "idle", "clicker", "sandbox", "building",
  "colorful", "family friendly", "cats", "nature", "fishing", "sailing",
  "automation", "management", "jigsaw", "board game", "card game", "beautiful",
  "emotional", "story rich", "music", "rhythm", "hand-drawn", "minimalist",
  "peaceful", "sleep", "philosophical", "cooking", "gardening", "farming",
];

export const INTENSE = [
  "violent", "gore", "blood", "horror", "psychological horror",
  "survival horror", "souls-like", "difficult", "bullet hell", "pvp",
  "competitive", "shooter", "fps", "war", "military", "zombies", "combat",
  "fast-paced", "hack and slash", "battle royale", "post-apocalyptic",
  "grimdark", "gun customization", "third-person shooter", "action-adventure",
  "beat 'em up", "fighting", "wargame", "nudity", "sexual content", "dark",
  "action", "action roguelike", "roguelike", "rogue-lite", "boss rush",
  "twin stick shooter", "arena shooter", "dark fantasy", "crime", "assassin",
  "character action game", "gun", "shoot 'em up", "tactical", "1990s",
  "spectacle fighter", "precision platformer", "masterpiece", "swordplay",
];

/*
 * How much evidence a score needs before it is allowed to be extreme.
 *
 * Without this the score is a bare ratio, and a bare ratio has no idea how
 * much it is standing on: a platformer tagged Action, Platformer, Side
 * Scroller that happened to pick up Casual and Cute came out at a perfect
 * 100, because two mild signals divided by two mild signals is one. Adding a
 * constant to the denominator pulls anything thinly evidenced back towards
 * the middle, which is where a game nobody has described properly belongs.
 */
const PRIOR = 0.35;

/**
 * How calm a game is, from its tags.
 *
 * Weighted by rank — players vote tags up, so the first is what the game is
 * mostly like and the twentieth is a detail — and damped by the prior above,
 * so a game with two faint signals lands near the middle rather than at an
 * end.
 */
export function calmScore(tags: string[]) {
  let calm = 0;
  let intense = 0;
  tags.forEach((tag, i) => {
    const t = tag.toLowerCase();
    const w = 1 / (i + 2);
    if (CALM.includes(t)) calm += w;
    if (INTENSE.includes(t)) intense += w;
  });
  if (calm + intense === 0) return 0;
  return Math.round(((calm - intense) / (calm + intense + PRIOR)) * 100);
}

/**
 * Games calm enough to put on without bracing yourself.
 *
 * Forty rather than twenty-five. At twenty-five the calm list led with visual
 * novels scoring in the low thirties — not tense, but not what anybody means
 * by a calm game either, and they were crowding out the things that are.
 */
export const CALM_BAR = 40;

export function isCalm(game: Game) {
  return game.calm >= CALM_BAR;
}

/*
 * SteamSpy publishes ownership as a band and the store keeps the midpoint,
 * which is fine for ranking and a lie when printed. Two hundred and
 * seventy-seven of these games sit in the 0–20,000 band and every one of them
 * would read as "10k players" — a precision nobody measured, on exactly the
 * obscure games this directory exists to find. Said as a band it is true.
 */
const BANDS: [number, string][] = [
  [10_000, "under 20,000"],
  [35_000, "20–50,000"],
  [75_000, "50–100,000"],
  [150_000, "100–200,000"],
  [350_000, "200–500,000"],
  [750_000, "half a million or so"],
  [1_500_000, "over a million"],
  [3_500_000, "a few million"],
];

export function reach(game: Game): string {
  const hit = BANDS.find(([mid]) => game.owners <= mid);
  return hit ? hit[1] : "many millions";
}

/**
 * The buried-gem score: well regarded, and hardly played.
 *
 * `regard` alone finds the famous good games; owners alone finds the obscure
 * ones, most of which are obscure for a reason. Together they find the ones
 * that the people who did play them thought were excellent — which is the
 * only definition of an overlooked game that survives contact with the data.
 */
export function obscurity(game: Game): number {
  if (game.regard === null || game.reviews < 40) return 0;
  // Owners span five orders of magnitude, so the axis has to be logarithmic
  // or everything under a million collapses into one indistinguishable heap.
  const reach = Math.log10(Math.max(game.owners, 1000));
  const quality = (game.regard - 60) / 40; // −1.5 … 1
  return Math.round(Math.max(0, quality) * Math.max(0, 7 - reach) * 25);
}

/**
 * If you liked that, this.
 *
 * Tag overlap, weighted so that a tag both games list near the top counts for
 * more than one they each mention in passing — two games tagged Relaxing
 * first and second are far more alike than two that have it eleventh. Steam
 * publishes no similarity anyone can fetch, and computing it here has the
 * advantage that the reasoning can be shown rather than asserted.
 */
export function similarTo(game: Game, pool: Game[], count = 6): Game[] {
  const weight = (tags: string[]) =>
    new Map(tags.map((t, i) => [t.toLowerCase(), 1 / (i + 2)]));
  const mine = weight(game.tags);

  return pool
    .filter((g) => g.id !== game.id)
    .map((g) => {
      const theirs = weight(g.tags);
      let score = 0;
      for (const [tag, w] of mine) {
        const t = theirs.get(tag);
        if (t) score += w + t;
      }
      // A quiet game should not be recommended a violent one on the strength
      // of them both being indie puzzlers.
      const gap = Math.abs(g.calm - game.calm) / 100;
      return { g, score: score * (1 - gap * 0.6) };
    })
    .filter((s) => s.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.g);
}

/** Which tags two games actually share, for saying why. */
export function sharedTags(a: Game, b: Game, count = 4): string[] {
  const theirs = new Set(b.tags.map((t) => t.toLowerCase()));
  return a.tags.filter((t) => theirs.has(t.toLowerCase())).slice(0, count);
}

export function allPlatforms(): string[] {
  const seen = new Map<string, number>();
  for (const g of allGames()) {
    for (const p of g.platforms) seen.set(p, (seen.get(p) ?? 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
}

export function allTags(min = 12): string[] {
  const seen = new Map<string, number>();
  for (const g of allGames()) {
    for (const t of g.tags) seen.set(t, (seen.get(t) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
}
