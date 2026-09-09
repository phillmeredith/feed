import Link from "next/link";
import { navItems } from "@/lib/categories";
import { references } from "@/lib/reference";

/**
 * The folio.
 *
 * A newspaper's last line is not a sitemap — it is three short statements set
 * across the foot of the sheet: who printed this, what else is in it, and the
 * terms under which you are reading it. The desks and the reference pages are
 * listed above it because the site is not printed and a reader cannot turn a
 * page to find them.
 */
export function Footer() {
  return (
    <footer className="sheet pb-16">
      <div className="band-rule flex flex-wrap gap-x-[clamp(32px,5vw,90px)] gap-y-10 pt-8">
        <div className="max-w-sm">
          <p className="display text-2xl">The Dispatch</p>
          <p className="standfirst mt-3 text-small">
            Every new release worth knowing about, gathered from the outlets that
            announce them. Headlines link back to the original reporting.
          </p>
        </div>

        <nav className="flex flex-col gap-2 kicker text-micro text-muted">
          <span className="text-faint">Desks</span>
          {navItems().map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2 kicker text-micro text-muted">
          <span className="text-faint">Reference</span>
          {references.map((ref) => (
            <Link
              key={ref.slug}
              href={`/${ref.slug}`}
              className="transition-colors hover:text-accent"
            >
              {ref.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4 border-t border-rule-strong pt-4 kicker text-micro font-medium tracking-[0.17em] text-faint">
        <span>The Dispatch</span>
        <span className="hidden sm:inline">
          Model catalogue · Gear directory · Rumour board
        </span>
        <span>Headlines link to the original reporting</span>
      </div>
    </footer>
  );
}
