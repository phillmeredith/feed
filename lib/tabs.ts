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
  f1: [
    { slug: "", label: "This weekend" },
    { slug: "calendar", label: "Calendar" },
    { slug: "standings", label: "Standings" },
    { slug: "articles", label: "Articles" },
  ],
};

export function tabsFor(desk: CategorySlug): Tab[] {
  return DESK_TABS[desk] ?? [];
}

export function tabHref(desk: CategorySlug, tab: Tab) {
  return tab.slug ? `/${desk}/${tab.slug}` : `/${desk}`;
}
