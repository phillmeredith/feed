import type { CategorySlug } from "./types";

/**
 * The third tier of navigation.
 *
 * The site had two: sections across the top, and desks within a section. That
 * is enough while a desk is a feed, and stops being enough the moment a desk
 * is also a calendar, a set of results and a championship table — which is
 * what the sport desks became. Stacking all of it down one page made the
 * page long and the parts hard to find.
 *
 * These are routes rather than client-side tabs, so each is linkable, each is
 * cached on its own, and the back button behaves.
 */
export interface Tab {
  /** Appended to the desk path; the empty string is the desk's own page. */
  slug: string;
  label: string;
}

export const DESK_TABS: Partial<Record<CategorySlug, Tab[]>> = {
  /*
   * Articles first, and on the desk's own address.
   *
   * The reporting is what a desk is for most days of the week; the fixtures
   * and the tables are what you go looking for when something is on. Landing
   * on the weekend meant the desk showed a race three days away above a feed
   * it was also duplicating.
   */
  f1: [
    { slug: "", label: "Articles" },
    { slug: "weekend", label: "This weekend" },
    { slug: "calendar", label: "Calendar" },
    { slug: "standings", label: "Standings" },
  ],
  golf: [
    { slug: "", label: "Articles" },
    { slug: "this-week", label: "This week" },
    { slug: "majors", label: "The majors" },
    { slug: "season", label: "Season" },
  ],
  ufc: [
    { slug: "", label: "Articles" },
    { slug: "next", label: "Next card" },
    { slug: "cards", label: "Every card" },
  ],
};

export function tabsFor(desk: CategorySlug): Tab[] {
  return DESK_TABS[desk] ?? [];
}

export function tabHref(desk: CategorySlug, tab: Tab) {
  return tab.slug ? `/${desk}/${tab.slug}` : `/${desk}`;
}
