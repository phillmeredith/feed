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

/** Everything the archive holds, for entity pages that must not fetch. */
export function allArchived(): Article[] {
  return ITEMS as Article[];
}

export function archiveSize() {
  return ITEMS.length;
}
