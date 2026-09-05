import Link from "next/link";
import type { Article } from "@/lib/types";
import { relativeDate } from "@/lib/format";

/**
 * The wire rail. Items link to their own story pages, never off-site — the
 * whole point of the desk is that the reporting is readable here.
 */
export function BriefsColumn({ items }: { items: Article[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-rule pb-3">
        <h2 className="kicker text-[10px] text-accent">The Wire</h2>
        <p className="font-serif italic text-xs text-faint">No noise</p>
      </div>

      <ol className="mt-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/story/${item.id}`} className="group block py-5">
              <h3 className="font-body text-[15px] leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                {item.headline}
              </h3>
              <p className="kicker text-[9px] text-faint mt-2">
                {item.source}
                <span className="mx-2 text-rule">/</span>
                {relativeDate(item.publishedAt)}
              </p>
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href="/wire"
        className="kicker text-[10px] text-muted hover:text-accent transition-colors mt-4 inline-block"
      >
        More from the wire →
      </Link>
    </section>
  );
}
