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
  /**
   * An address outside the desk's own path.
   *
   * The gear directory, the rumour board and the model catalogue existed as
   * reference pages before the desks had tabs, and they are the good versions
   * — linked, complete, and built for the job. Rebuilding them as tabs
   * produced second copies; pointing at them instead does not.
   */
  href?: string;
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

  /*
   * Outside sport, a desk earns tabs only where it has standing material.
   * Screen, Wire and Technique are feeds and nothing else, so they get none —
   * DeskTabs renders nothing rather than a single tab labelled Articles,
   * which would be a tab bar that does not navigate.
   */
  gaming: [
    { slug: "", label: "Articles" },
    /* The directory is the reason this desk exists; the reporting is the
       thing beside it. Both are named plainly. */
    { slug: "directory", label: "The directory", href: "/games" },
    { slug: "calm", label: "Calm games", href: "/games/calm" },
  ],
  science: [
    { slug: "", label: "Articles" },
    { slug: "launches", label: "Launches" },
  ],
  ai: [
    { slug: "", label: "Articles" },
    /* Fifteen recent releases, which is a different question from the four
       hundred in the catalogue and was confusingly called the same thing. */
    { slug: "models", label: "Releases" },
    /* The catalogue read as a history rather than a price list: what has been
       released, when, and how much bigger it got. */
    { slug: "map", label: "The map" },
    { slug: "catalogue", label: "Catalogue", href: "/model" },
  ],
  cameras: [
    { slug: "", label: "Articles" },
    { slug: "directory", label: "Directory", href: "/gear" },
    { slug: "rumours", label: "Rumours", href: "/rumours" },
  ],
  lenses: [
    { slug: "", label: "Articles" },
    { slug: "directory", label: "Directory", href: "/gear" },
  ],
  /*
   * Hardware and Robotics are feeds again. Their only tab was Patents, and a
   * tab bar with one destination does not navigate.
   */
  /*
   * Weather is the exception to Articles-first. Nobody opens a weather page
   * to read about weather; they open it to find out what it is doing. The
   * forecast is the desk and the reporting is the tab.
   */
  weather: [
    { slug: "", label: "Forecast" },
    { slug: "climate", label: "The planet" },
    { slug: "articles", label: "Articles" },
  ],
};

export function tabsFor(desk: CategorySlug): Tab[] {
  return DESK_TABS[desk] ?? [];
}

export function tabHref(desk: CategorySlug, tab: Tab) {
  if (tab.href) return tab.href;
  return tab.slug ? `/${desk}/${tab.slug}` : `/${desk}`;
}
