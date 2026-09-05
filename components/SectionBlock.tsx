import type { Article, Category } from "@/lib/types";
import { CompactCard, StandardCard } from "./ArticleCard";

export function SectionBlock({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  return (
    <section id={category.slug} className="scroll-mt-8">
      <div className="flex items-end justify-between gap-6 border-b-2 border-ink pb-2">
        <h2 className="kicker text-[13px] text-accent">{category.label}</h2>
        <p className="font-display italic text-sm text-ink-faint">
          {category.dek}
        </p>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <StandardCard article={lead} />
        </div>
        <div className="flex flex-col gap-4">
          {rest.slice(0, 3).map((a) => (
            <CompactCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
