import sanitizeHtml from "sanitize-html";

/**
 * The rich half of a game's record, fetched when somebody actually opens it.
 *
 * The directory's store holds what a card needs — a name, a date, the tags,
 * one screenshot. Everything on this page is the other half: four more
 * screenshots, a trailer, a description, what people wrote about it. Nine
 * thousand games' worth of that is a store nobody can import at build time,
 * and it would be stale the moment it was written.
 *
 * So it is fetched here and cached for a day. A game's description does not
 * change often; its reviews do, and this way they are current rather than
 * whenever the last ingest happened to run.
 */

const UA = "TheDispatch/1.0 (games directory)";
const DAY = 86_400;

export interface Shot {
  thumb: string;
  full: string;
}

export interface Trailer {
  name: string;
  thumb: string;
  mp4: string;
}

export interface SteamDetail {
  about: string;
  shots: Shot[];
  trailer: Trailer | null;
  metacritic: { score: number; url: string } | null;
  publisher: string;
  website: string;
  /** Steam's own accessibility and comfort features, where a game lists them. */
  features: string[];
}

export interface Review {
  positive: boolean;
  text: string;
  helpful: number;
  hours: number | null;
}

export interface Reviews {
  summary: string;
  positive: number;
  total: number;
  sample: Review[];
}

/*
 * Steam writes its store copy in a house dialect of HTML with inline styles,
 * image strips and BBCode leftovers. Only the prose is wanted.
 */
function prose(html: string, limit = 1600) {
  const clean = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "h2", "h3"],
    allowedAttributes: {},
  });
  return clean.length > limit ? `${clean.slice(0, limit)}…` : clean;
}

export async function steamDetail(appid: number): Promise<SteamDetail | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`,
      { headers: { "user-agent": UA }, next: { revalidate: DAY } }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as Record<
      string,
      { success: boolean; data?: Record<string, unknown> }
    >;
    const d = body[String(appid)]?.data;
    if (!d) return null;

    const movie = ((d.movies ?? []) as Record<string, unknown>[])[0];
    const mp4 = (movie?.mp4 as Record<string, string> | undefined) ?? {};

    return {
      about: prose((d.about_the_game as string) ?? ""),
      shots: ((d.screenshots ?? []) as { path_thumbnail: string; path_full: string }[])
        .slice(0, 6)
        .map((s) => ({ thumb: s.path_thumbnail, full: s.path_full })),
      trailer: movie
        ? {
            name: (movie.name as string) ?? "Trailer",
            thumb: (movie.thumbnail as string) ?? "",
            mp4: mp4.max ?? mp4["480"] ?? "",
          }
        : null,
      metacritic: (d.metacritic as { score: number; url: string } | undefined) ?? null,
      publisher: (((d.publishers ?? []) as string[])[0] ?? "").slice(0, 60),
      website: (d.website as string) ?? "",
      /* The comfort and accessibility rows, which for a directory built around
         playing gently are more use than the trading-card ones. */
      features: ((d.categories ?? []) as { description: string }[])
        .map((c) => c.description)
        .filter((c) =>
          /controller|accessib|text size|colou?r|volume|camera|subtitle|remote|cloud|co-op|single-player/i.test(c)
        )
        .slice(0, 8),
    };
  } catch {
    return null;
  }
}

export async function steamReviews(appid: number): Promise<Reviews | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/appreviews/${appid}?json=1&filter=all&language=english&review_type=all&purchase_type=all&num_per_page=8`,
      { headers: { "user-agent": UA }, next: { revalidate: DAY } }
    );
    if (!res.ok) return null;
    const d = (await res.json()) as {
      success: number;
      query_summary?: {
        review_score_desc?: string;
        total_positive?: number;
        total_reviews?: number;
      };
      reviews?: {
        voted_up: boolean;
        review: string;
        votes_up: number;
        author?: { playtime_forever?: number };
      }[];
    };
    if (!d.success || !d.query_summary?.total_reviews) return null;

    return {
      summary: d.query_summary.review_score_desc ?? "",
      positive: d.query_summary.total_positive ?? 0,
      total: d.query_summary.total_reviews ?? 0,
      sample: (d.reviews ?? [])
        /* Steam's markup dialect again, and the very short ones ("10/10") say
           nothing a score has not already said. */
        .map((r) => ({
          positive: r.voted_up,
          text: r.review.replace(/\[\/?[a-z=\]]*\]/gi, "").trim(),
          helpful: r.votes_up,
          hours: r.author?.playtime_forever
            ? Math.round(r.author.playtime_forever / 60)
            : null,
        }))
        .filter((r) => r.text.length > 80)
        .sort((a, b) => b.helpful - a.helpful)
        .slice(0, 4),
    };
  } catch {
    return null;
  }
}
