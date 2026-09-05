import Link from "next/link";
import type { Group } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";
import { getFeed } from "@/lib/feed";
import { withArchive } from "@/lib/archive";
import { Masthead } from "./Masthead";
import { Footer } from "./Footer";
import { LeadCard, FeatureCard, ListCard } from "./cards";

/**
 * A section overview: the strongest story across the group, then a block per
 * desk beneath it. Keeps the nav to a handful of entries without burying the
 * desks themselves.
 */
export async function GroupPage({ group }: { group: Group }) {
  const { articles } = await getFeed();

  const desks = group.desks
    .map((slug) => ({
      category: categoryBySlug(slug),
      articles: withArchive(articles, slug),
    }))
    .filter((d) => d.category && d.articles.length > 0);

  const everything = desks
    .flatMap((d) => d.articles)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const lead = everything.find((a) => a.image) ?? everything[0];

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-10 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)] text-accent">
            {group.label}
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            {group.standfirst}
          </p>
          <p className="kicker text-[10px] text-faint mt-5">
            {desks.length} desks · {everything.length} stories
          </p>
        </div>

        {lead && (
          <div className="mt-12">
            <LeadCard article={lead} />
          </div>
        )}

        <div className="mt-20 flex flex-col gap-20">
          {desks.map(({ category, articles: deskArticles }) => {
            const rest = deskArticles.filter((a) => a.id !== lead?.id);
            const feature = rest.find((a) => a.image);
            const list = rest.filter((a) => a.id !== feature?.id).slice(0, 5);

            return (
              <section key={category!.slug} className="border-t border-rule pt-8">
                <div className="flex items-end justify-between gap-6 flex-wrap">
                  <div>
                    <h2 className="display text-2xl sm:text-3xl">
                      <Link
                        href={`/${category!.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {category!.label}
                      </Link>
                    </h2>
                    <p className="font-serif italic text-accent text-sm mt-2">
                      {category!.dek}
                    </p>
                  </div>
                  <Link
                    href={`/${category!.slug}`}
                    className="kicker text-[10px] text-muted hover:text-accent transition-colors"
                  >
                    All {deskArticles.length} stories →
                  </Link>
                </div>

                <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr]">
                  {feature && <FeatureCard article={feature} />}
                  <div className="flex flex-col gap-4">
                    {list.map((a) => (
                      <ListCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </>
  );
}
