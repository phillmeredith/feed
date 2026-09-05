import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LeadCard, FeatureCard, ListCard } from "@/components/cards";
import { SectionPreview } from "@/components/SectionPreview";
import { BriefsColumn } from "@/components/BriefsColumn";
import { TodayLive } from "@/components/TodayLive";
import { desks } from "@/lib/categories";
import { getFeed, pickHero, todaysWindow } from "@/lib/feed";
import type { Article } from "@/lib/types";

/*
 * Rendered per request rather than served from a cached copy. Next's default
 * is to hand over the stale page and rebuild behind it, so on a quiet site the
 * reader always saw the previous version — an hours-old clock and yesterday's
 * stories. The upstream feeds are still cached for ten minutes, so this costs
 * a re-render rather than a re-fetch.
 */
export const dynamic = "force-dynamic";
// Feed fetching and extraction need more than the default budget.
export const maxDuration = 60;

export default async function Home() {
  const { articles, briefs } = await getFeed();

  const { releases, breaking, label: windowLabel } = todaysWindow(articles);

  const lead = pickHero(articles);

  /*
   * The four cards at the top of the page are the whole first impression, so
   * they have to come from four different places. Ranking on recency alone
   * would otherwise hand all four to whichever outlet happened to file a burst
   * of stories in the last hour — three tripod reviews from one photography
   * title, and nothing else above the fold. Preference goes to a fresh story
   * from an unrepresented desk; if there aren't three of those with artwork,
   * the remaining slots relax to merely a different outlet.
   */
  const secondary: Article[] = [];
  const usedSources = new Set([lead?.source]);
  const usedDesks = new Set([lead?.category]);

  for (const requireNewDesk of [true, false]) {
    for (const a of articles) {
      if (secondary.length === 3) break;
      if (a.id === lead?.id || !a.image) continue;
      if (secondary.some((s) => s.id === a.id)) continue;
      if (usedSources.has(a.source)) continue;
      if (requireNewDesk && usedDesks.has(a.category)) continue;
      secondary.push(a);
      usedSources.add(a.source);
      usedDesks.add(a.category);
    }
  }
  const featuredIds = new Set([lead?.id, ...secondary.map((a) => a.id)]);
  const latest = [...articles]
    .filter((a) => !featuredIds.has(a.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 8);
  const shownAbove = new Set([...featuredIds, ...latest.map((a) => a.id)]);

  return (
    <>
      <Masthead />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-10 py-12 flex-1 w-full">

        <TodayLive
          releases={releases}
          breaking={breaking}
          windowLabel={windowLabel}
        />

        <div className="mt-16">{lead && <LeadCard article={lead} />}</div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="grid gap-10 sm:grid-cols-3">
              {secondary.map((a) => (
                <FeatureCard key={a.id} article={a} />
              ))}
            </div>

            <div className="mt-16">
              <h2 className="kicker text-[10px] text-accent border-b border-rule pb-3">
                Latest across the desks
              </h2>
              {/* The heading's rule already divides the section, so the first
                  row of items drops its own top border. */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 [&>*:first-child]:border-t-0 sm:[&>*:nth-child(-n+2)]:border-t-0">
                {latest.map((a) => (
                  <ListCard key={a.id} article={a} showDesk />
                ))}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <BriefsColumn items={briefs.slice(0, 6)} />
          </aside>
        </div>

        <div className="mt-24 flex flex-col gap-24">
          {desks.map((category) => {
            const deskArticles = articles.filter(
              (a) => a.category === category.slug
            );
            return (
              <SectionPreview
                key={category.slug}
                category={category}
                articles={deskArticles.filter((a) => !shownAbove.has(a.id))}
                total={deskArticles.length}
              />
            );
          })}
        </div>
      </main>

      <Footer />
    </>
  );
}
