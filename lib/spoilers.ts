import type { Article, CategorySlug } from "./types";
import f1 from "../data/f1.json" with { type: "json" };
import golf from "../data/golf.json" with { type: "json" };
import ufc from "../data/ufc.json" with { type: "json" };

/**
 * Which headlines give a result away.
 *
 * Guarding the podium is no use if the desk beneath it is running "Russell
 * beats Leclerc to top spot". But blurring every headline on a sport desk
 * would hide the reporting along with the results, and most sport writing
 * gives nothing away — "Why Norris wanted his own single-seater team" spoils
 * nothing at all.
 *
 * So the test is narrow, and it is two things at once: the headline has to
 * read like a result, and it has to name somebody who actually won something
 * recently. Either alone is far too broad — "wins" appears in preview pieces,
 * and a winner's name appears in half the coverage of any sport.
 */
const RESULT_SHAPE =
  /\b(wins?|won|beat(s|en)?|defeat(s|ed)?|victor(y|ious)|triumph\w*|seal(s|ed)?|claim(s|ed)?|edges?|holds? off|clinch\w*|crowned|champion(ship)?|takes? (pole|the win|victory|the title)|KOs?|knocks? out|submits?|stopp?(s|ed)|finishes? off|survives?|denies?|upsets?)\b/i;

/** Names that recently won something, from the same stores the pages read. */
function winnerNames(): Map<CategorySlug, Set<string>> {
  const map = new Map<CategorySlug, Set<string>>([
    ["f1", new Set()],
    ["golf", new Set()],
    ["ufc", new Set()],
  ]);

  const add = (desk: CategorySlug, name?: string) => {
    if (!name) return;
    // Surnames are what a headline uses; first names rarely appear alone.
    const parts = name.trim().split(/\s+/);
    const surname = parts[parts.length - 1];
    if (surname && surname.length > 2) map.get(desk)!.add(surname.toLowerCase());
  };

  for (const race of (f1 as { races: { winner?: string }[] }).races) {
    add("f1", race.winner);
  }
  for (const event of (golf as { events: { winner?: string }[] }).events) {
    add("golf", event.winner);
  }
  for (const event of (ufc as { events: { fights: { winner?: string }[] }[] })
    .events) {
    for (const fight of event.fights) add("ufc", fight.winner);
  }

  return map;
}

const WINNERS = winnerNames();

/** Only the three sport desks carry results worth hiding. */
const GUARDED: CategorySlug[] = ["f1", "golf", "ufc"];

export function isResultSpoiler(article: Article): boolean {
  if (!GUARDED.includes(article.category)) return false;
  if (!RESULT_SHAPE.test(article.headline)) return false;

  const names = WINNERS.get(article.category);
  if (!names || names.size === 0) return false;

  const words = article.headline.toLowerCase().match(/[a-zà-ÿ']+/g) ?? [];
  return words.some((word) => names.has(word));
}
