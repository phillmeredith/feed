import Link from "next/link";
import { categoryBySlug, groupBySlug, groups } from "@/lib/categories";
import { referencesForGroup } from "@/lib/reference";

/**
 * The way around a section.
 *
 * The top nav gets you to Technology or Sport; this gets you to the desks
 * inside one, and to the reference sections that belong to them. Without it a
 * group page is a dead end with a single button on it — and a button labelled
 * "The season" on a page covering three sports doesn't say which season.
 */
export function SubNav({
  group: groupSlug,
  current,
}: {
  group: string;
  current?: string;
}) {
  const group = groupBySlug(groupSlug) ?? groups.find((g) => g.slug === groupSlug);
  if (!group) return null;

  const desks = group.desks
    .map((slug) => categoryBySlug(slug))
    .filter((c) => c !== undefined);
  const refs = referencesForGroup(group.desks);

  return (
    /*
     * The second tier, made to look like navigation rather than a line of
     * links. It was a row of small grey text mixed in with the reference
     * sections, which read as a footnote under the headline; the desks now
     * carry the weight and the reference material sits after a divider.
     */
    <nav
      aria-label={`${group.label} desks`}
      className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
    >
      <Link
        href={`/${group.slug}`}
        aria-current={current === group.slug ? "page" : undefined}
        className={`kicker text-[11px] ${
          current === group.slug
            ? "text-accent font-semibold"
            : "text-muted hover:text-accent transition-colors"
        }`}
      >
        All {group.label}
      </Link>

      <span className="text-rule" aria-hidden="true">
        |
      </span>

      {desks.map((desk) => (
        <Link
          key={desk.slug}
          href={`/${desk.slug}`}
          aria-current={current === desk.slug ? "page" : undefined}
          className={`display text-lg sm:text-xl transition-colors ${
            current === desk.slug
              ? "text-accent"
              : "text-paper hover:text-accent"
          }`}
        >
          {desk.label}
        </Link>
      ))}

      {refs.length > 0 && (
        <>
          <span className="text-rule" aria-hidden="true">
            |
          </span>
          {refs.map((ref) => (
            <Link
              key={ref.slug}
              href={`/${ref.slug}`}
              aria-current={current === ref.slug ? "page" : undefined}
              className={`kicker text-[10px] ${
                current === ref.slug
                  ? "text-accent"
                  : "text-faint hover:text-accent transition-colors"
              }`}
            >
              {ref.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
