import Link from "next/link";
import { categoryBySlug, groupBySlug, groups } from "@/lib/categories";
import { referencesForGroup } from "@/lib/reference";

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
  const refs = referencesForGroup(group.desks);

  return (
    <nav
      aria-label={`${group.label} desks`}
      className="mt-8 bg-surface/40"
    >
      <ul className="flex flex-wrap items-stretch">
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
                    "text-paper"
                  )}
                >
                  {desk.label}
                  {active && <span className="sr-only"> (current)</span>}
                </span>
              </Link>
            </li>
          );
        })}

        {refs.length > 0 && (
          <>
            {refs.map((ref) => {
              const active = current === ref.slug;
              return (
                <li key={ref.slug}>
                  <Link
                    href={`/${ref.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={navItemClass(active)}
                  >
                    <span
                      className={labelClass(
                        active,
                        "kicker text-micro",
                        "text-faint"
                      )}
                    >
                      {ref.label}
                      {active && <span className="sr-only"> (current)</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </>
        )}
      </ul>
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
    "group block px-4 py-3 transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
    active ? "bg-surface" : "hover:bg-surface",
  ].join(" ");
}

/** The label's states: rest, hover (via the link's group) and current. */
function labelClass(active: boolean, type: string, rest = "text-muted") {
  return [
    type,
    "transition-colors",
    active ? "text-accent" : `${rest} group-hover:text-paper`,
  ].join(" ");
}
