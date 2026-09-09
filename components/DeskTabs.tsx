import Link from "next/link";
import type { CategorySlug } from "@/lib/types";
import { tabsFor, tabHref } from "@/lib/tabs";
import { KeepCurrentInView } from "./KeepCurrentInView";

/**
 * Tabs within a desk — the third tier, under the section nav.
 *
 * Tabs, not links: they sit on a rule and the current one breaks it, which is
 * the oldest way of saying "you are here" and needs no colour to read. Every
 * state is defined rather than left to the browser — rest, hover, focus and
 * current — because a nav that only styles two of the four is a nav that
 * feels broken the moment you use a keyboard.
 */
export function DeskTabs({
  desk,
  current = "",
}: {
  desk: CategorySlug;
  current?: string;
}) {
  const tabs = tabsFor(desk);
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Sections of this desk"
      className="mt-8 border-b border-rule nav-scroll"
    >
      <ul className="flex flex-nowrap">
        {tabs.map((tab) => {
          const active = tab.slug === current;
          return (
            <li key={tab.slug || "index"}>
              <Link
                href={tabHref(desk, tab)}
                aria-current={active ? "page" : undefined}
                /*
                 * Colour goes on the span, not the link: globals.css sets
                 * `a { color: inherit }` site-wide, which beats a utility
                 * class on the anchor itself. The border is set with an
                 * explicit variable for the same reason — the reset gives
                 * every element a default border-color of --rule.
                 */
                className={`group block px-4 py-3 border-b-2 whitespace-nowrap transition-colors
                  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]
                  ${active ? "" : "hover:bg-surface"}`}
                style={{
                  borderBottomColor: active ? "var(--accent)" : "transparent",
                }}
              >
                <span
                  className={`kicker text-label transition-colors ${
                    active
                      ? "text-accent font-semibold"
                      : "text-muted group-hover:text-ink"
                  }`}
                >
                  {tab.label}
                  {active && <span className="sr-only"> (current)</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <KeepCurrentInView />
    </nav>
  );
}
