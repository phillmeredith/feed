import Link from "next/link";
import { categories } from "@/lib/categories";

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

        <nav className="flex flex-wrap gap-x-8 gap-y-2 kicker text-[10px] text-muted">
          {categories.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="hover:text-accent">
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
