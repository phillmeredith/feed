import Link from "next/link";
import { categoryBySlug, groupBySlug, groups } from "@/lib/categories";
import { KeepCurrentInView } from "./KeepCurrentInView";

/**
 * The second tier: the desks inside a section.
 *
 * This began as a row of small grey text mixed in with the reference links,
 * which read as a footnote under the headline rather than as a way around the
 * site. It is a band now — its own ground, its own rule — with the desks
 * carrying the weight and the reference sections after a divider, so the two
 * kinds of destination are not competing.
 *
 * States are all four: rest, hover, focus-visible and current. The current
 * desk is marked by a filled ground as well as by colour.
 */
export function SubNav({
  group: groupSlug,
  current,
}: {
  group: string;
  current?: string;
}) {
  const group =
    groupBySlug(groupSlug) ?? groups.find((g) => g.slug === groupSlug);
  if (!group) return null;

  const desks = group.desks
    .map((slug) => categoryBySlug(slug))
    .filter((c) => c !== undefined);

  return (
    <nav
      aria-label={`${group.label} desks`}
      className="nav-scroll mt-8 border-b border-rule-strong"
    >
      <ul className="flex flex-nowrap items-stretch">
        <li>
          <Link
            href={`/${group.slug}`}
            aria-current={current === group.slug ? "page" : undefined}
            className={navItemClass(current === group.slug)}
          >
            <span className={labelClass(current === group.slug, "kicker text-micro")}>
              All {group.label}
              {current === group.slug && (
                <span className="sr-only"> (current)</span>
              )}
            </span>
          </Link>
        </li>

        {desks.map((desk) => {
          const active = current === desk.slug;
          return (
            <li key={desk.slug}>
              <Link
                href={`/${desk.slug}`}
                aria-current={active ? "page" : undefined}
                className={navItemClass(active)}
              >
                <span
                  className={labelClass(
                    active,
                    "display text-lg sm:text-xl",
                    "text-ink"
                  )}
                >
                  {desk.label}
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

/**
 * The link's own states: ground and focus ring.
 *
 * Colour is not among them, because globals.css sets `a { color: inherit }`
 * site-wide and any text utility on the anchor is overruled by it. That goes
 * on the span instead.
 */
function navItemClass(active: boolean) {
  return [
    /*
     * Tabs on a rule, not tabs in a box.
     *
     * This was a filled panel with a darker fill marking the current desk,
     * which on a dark page read as a control and on paper reads as a grey
     * rectangle sitting on the newsprint. The row now sits on the section
     * rule and the current desk breaks it — the oldest way of saying "you are
     * here", and one that needs no fill and no colour to be legible.
     */
    "group block px-4 py-3 -mb-px border-b-2 transition-colors whitespace-nowrap",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
    active ? "border-b-[var(--ink)]" : "border-b-transparent",
  ].join(" ");
}

/** The label's states: rest, hover (via the link's group) and current. */
function labelClass(active: boolean, type: string, rest = "text-muted") {
  return [
    type,
    "transition-colors",
    active ? "text-ink" : `${rest} group-hover:text-ink`,
  ].join(" ");
}
