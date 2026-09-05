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
    <nav className="mt-8 flex flex-wrap items-baseline gap-x-7 gap-y-3 kicker text-[10px]">
      <Link
        href={`/${group.slug}`}
        className={
          current === group.slug
            ? "text-accent"
            : "text-muted hover:text-accent transition-colors"
        }
      >
        All {group.label}
      </Link>

      <span className="text-rule">|</span>

      {desks.map((desk) => (
        <Link
          key={desk.slug}
          href={`/${desk.slug}`}
          className={
            current === desk.slug
              ? "text-accent"
              : "text-muted hover:text-accent transition-colors"
          }
        >
          {desk.label}
        </Link>
      ))}

      {refs.length > 0 && (
        <>
          <span className="text-rule">|</span>
          {refs.map((ref) => (
            <Link
              key={ref.slug}
              href={`/${ref.slug}`}
              className={
                current === ref.slug
                  ? "text-accent"
                  : "text-faint hover:text-accent transition-colors"
              }
            >
              {ref.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
