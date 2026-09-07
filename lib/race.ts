import type { Article } from "./types";
import type { Race } from "./f1";

/**
 * The reporting that belongs to one round.
 *
 * A Grand Prix is written about under half a dozen names — the country, the
 * circuit, the city, the shorthand ("Italian GP", "Monza"). Matching on the
 * full official name alone finds almost nothing, so this matches on any of
 * the words that identify the round and are distinctive enough to mean it.
 */
export function racePageArticles(
  articles: Article[],
  race: Race,
  limit = 8
): Article[] {
  const country = race.name.replace(/\s*Grand Prix$/i, "").trim();
  const terms = [country, race.locality, race.circuitName.split(/\s+/)[0]]
    .filter((t) => t && t.length > 3)
    .map((t) => t.toLowerCase());

  if (terms.length === 0) return [];

  return articles
    .filter((article) => {
      const text = article.headline.toLowerCase();
      return terms.some((term) => text.includes(term));
    })
    .slice(0, limit);
}
