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
      className="nav-scroll mt-6 border-b border-rule-strong"
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
                className={`group block -mb-px whitespace-nowrap border-b-2 px-4 py-3 transition-colors
                  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]`}
                /*
                 * Ink, not oxide. The desk nav above this one marks its
                 * current item by breaking the rule in ink, and two navs
                 * stacked three centimetres apart marking the same idea two
                 * different ways is two ideas as far as a reader is concerned.
                 */
                style={{
                  borderBottomColor: active ? "var(--ink)" : "transparent",
                }}
              >
                <span
                  className={`kicker text-micro tracking-[0.2em] transition-colors ${
                    active ? "text-ink" : "text-muted group-hover:text-ink"
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
