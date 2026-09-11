import type { Article, CategorySlug } from "./types";
import archive from "../data/archive.json" with { type: "json" };

/**
 * Publishers' feeds are a rolling window — most carry a fortnight at best, and
 * a story that scrolls off is gone. The archive keeps everything the site has
 * ever published so the desks accumulate instead of resetting.
 *
 * Article bodies are not stored: they run to megabytes and are re-read on
 * demand when a story page opens. What's kept is enough to list and rank.
 */
export interface ArchivedArticle {
  id: string;
  category: CategorySlug;
  headline: string;
  dek: string;
  source: string;
  url: string;
  image: string;
  publishedAt: string;
}

/**
 * Sport used to be one desk. It is three now — Formula One, golf and the UFC —
 * and the archive is full of stories filed under the old slug. Which outlet
 * filed a story is enough to say which of the three it belongs to, so the
 * archive is re-desked on load rather than rewritten.
 */
const SPORT_DESKS: Record<string, CategorySlug> = {
  "Motorsport Week": "f1",
  Autosport: "f1",
  "BBC Sport": "golf",
  "Golf.com": "golf",
  "MMA Fighting": "ufc",
  "MMA Mania": "ufc",
};

const ITEMS = (archive.items as ArchivedArticle[]).map((item) =>
  (item.category as string) === "sports"
    ? { ...item, category: SPORT_DESKS[item.source] ?? "f1" }
    : item
);

const byId = new Map(ITEMS.map((a) => [a.id, a]));

/** Everything ever seen on a desk, newest first, merged with what's live. */
export function withArchive(live: Article[], category?: CategorySlug): Article[] {
  const merged = new Map<string, Article>();

  for (const item of ITEMS) {
    if (category && item.category !== category) continue;
    merged.set(item.id, item as Article);
  }
  // Live wins: it carries artwork and body.
  for (const item of live) {
    if (category && item.category !== category) continue;
    merged.set(item.id, item);
  }

  return [...merged.values()].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
}

/** A story that has scrolled out of every feed but still has a page here. */
export function archivedStory(id: string): Article | null {
  return (byId.get(id) as Article | undefined) ?? null;
}

/** The oldest story on record, so a page can say what the archive cannot cover. */
export function recordingSince(): string | undefined {
  return ITEMS.reduce<string | undefined>(
    (oldest, item) => (!oldest || item.publishedAt < oldest ? item.publishedAt : oldest),
    undefined
  );
}

/** Everything the archive holds, for entity pages that must not fetch. */
export function allArchived(): Article[] {
  return ITEMS as Article[];
}

export function archiveSize() {
  return ITEMS.length;
}

/**
 * How much of a desk is the desk.
 *
 * A desk used to page forever: twenty-four stories a page and as many pages as
 * the archive had material for, so a reader who kept clicking Older ended up
 * three weeks back with nothing to say they had left the news behind. A
 * newspaper doesn't work that way — what is current sits on the desk and
 * everything else is in the morgue.
 *
 * Two pages is the desk. Everything past it is still here, still linked, still
 * searchable by the desk's own archive tab; it has simply stopped being what
 * the desk is showing you.
 */
export const PER_PAGE = 24;
export const DESK_PAGES = 2;
export const DESK_LIMIT = PER_PAGE * DESK_PAGES;

/** A desk's stories split into what it shows and what has fallen past it. */
export function deskSplit(all: Article[]): {
  live: Article[];
  overflow: Article[];
} {
  return { live: all.slice(0, DESK_LIMIT), overflow: all.slice(DESK_LIMIT) };
}

/**
 * An article cut down to what a listing needs.
 *
 * The same economy the store itself makes: a syndicated body runs to tens of
 * kilobytes and a client component that only prints a headline still pays to
 * have it serialised across the boundary. The archive pages and the front
 * page's reserves deal in hundreds of these, so they deal in these.
 */
export function listing(article: Article): Article {
  return {
    id: article.id,
    category: article.category,
    headline: article.headline,
    dek: article.dek,
    source: article.source,
    url: article.url,
    image: article.image,
    publishedAt: article.publishedAt,
  };
}
