import type { CategorySlug } from "./types";

/**
 * Reference sections: the parts of the site that aren't a feed.
 *
 * A desk answers "what happened today". These answer "what is this thing" —
 * the catalogue of models, the gear directory, the season's results. They need
 * their own way in, because burying a permanent reference at the bottom of a
 * page of news is the same as not having built it.
 *
 * Registered here so the footer, the desk headers and eventually search all
 * pick up a new one without being edited individually.
 */
export interface ReferenceSection {
  slug: string;
  label: string;
  dek: string;
  /** The desk this sits under, so its page can offer a way through. */
  desk: CategorySlug;
}

export const references: ReferenceSection[] = [
  {
    slug: "model",
    label: "Model catalogue",
    dek: "Every model, by what it costs",
    desk: "ai",
  },
];

export function referencesForDesk(desk: CategorySlug): ReferenceSection[] {
  return references.filter((r) => r.desk === desk);
}
