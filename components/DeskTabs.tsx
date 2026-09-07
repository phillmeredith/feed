import Link from "next/link";
import type { CategorySlug } from "@/lib/types";
import { tabsFor, tabHref } from "@/lib/tabs";

/**
 * Tabs within a desk — the third tier, under the section nav.
 *
 * Underlined rather than boxed, because the site has no other boxes, and the
 * current tab is marked by weight and a rule as well as by colour so it
 * survives a greyscale screen.
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
      className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-b border-rule"
    >
      {tabs.map((tab) => {
        const active = tab.slug === current;
        return (
          <Link
            key={tab.slug || "index"}
            href={tabHref(desk, tab)}
            aria-current={active ? "page" : undefined}
            className={`kicker text-[11px] pb-3 -mb-px border-b transition-colors ${
              active
                ? "text-accent border-accent font-semibold"
                : "text-muted border-transparent hover:text-accent"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
