import Link from "next/link";
import { navItems } from "@/lib/categories";
import { references } from "@/lib/reference";

export function Footer() {
  return (
    <footer className="border-t border-rule mt-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex flex-wrap items-start justify-between gap-8">
        <div>
          <p className="flex items-baseline gap-1">
            <span className="font-serif italic text-accent text-2xl">The</span>
            <span className="display text-xl">Dispatch</span>
          </p>
          <p className="text-sm text-muted mt-3 max-w-sm">
            Every new release worth knowing about, gathered from the outlets that
            announce them. Headlines link back to the original reporting.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-14 gap-y-8">
          <nav className="flex flex-col gap-2 kicker text-[10px] text-muted">
            <span className="text-faint">Desks</span>
            {navItems().map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="hover:text-accent">
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2 kicker text-[10px] text-muted">
            <span className="text-faint">Reference</span>
            {references.map((ref) => (
              <Link key={ref.slug} href={`/${ref.slug}`} className="hover:text-accent">
                {ref.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
