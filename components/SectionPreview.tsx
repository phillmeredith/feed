import Link from "next/link";
import type { Article, Category } from "@/lib/types";
import { FeatureCard, ListCard } from "./cards";

export function SectionPreview({
  category,
  articles,
  total,
}: {
  category: Category;
  articles: Article[];
  total: number;
}) {
  // A section opener carries the block, so lead with a story that has artwork.
  const lead = articles.find((a) => a.image) ?? articles[0];
  const rest = articles.filter((a) => a.id !== lead?.id);
  if (!lead) return null;

  return (
    <section className="border-t border-rule pt-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="display text-2xl sm:text-3xl">
            <Link href={`/${category.slug}`} className="hover:text-accent transition-colors">
              {category.label}
            </Link>
          </h2>
          <p className="font-serif italic text-accent text-sm mt-2">
            {category.dek}
          </p>
        </div>

        <Link
          href={`/${category.slug}`}
          className="kicker text-[10px] text-muted hover:text-accent transition-colors"
        >
          All {total} stories →
        </Link>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <FeatureCard article={lead} />
        <div className="flex flex-col gap-4">
          {rest.slice(0, 4).map((a) => (
            <ListCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
