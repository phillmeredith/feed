import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LeadCard, FeatureCard, ListCard } from "@/components/cards";
import { SectionPreview } from "@/components/SectionPreview";
import { BriefsColumn } from "@/components/BriefsColumn";
import { TodayLive } from "@/components/TodayLive";
import { desks } from "@/lib/categories";
import { getFeed, RELEASE_TERMS } from "@/lib/feed";

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

  // Everything filed since midnight, or the last 24 hours if today is still
  // thin — split into launches and everything else of consequence.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sinceMidnight = articles.filter(
    (a) => new Date(a.publishedAt) >= startOfDay
  );
  const useDay = sinceMidnight.length >= 6;
  const recent = (
    useDay
      ? sinceMidnight
      : articles.filter(
          (a) => Date.now() - new Date(a.publishedAt).getTime() < 86_400_000
        )
  ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const releases = recent.filter((a) => RELEASE_TERMS.test(a.headline)).slice(0, 6);
  const releaseIds = new Set(releases.map((a) => a.id));
  const breaking = recent.filter((a) => !releaseIds.has(a.id)).slice(0, 6);

  const featured = articles.filter((a) => a.featured);
  const lead = featured.find((a) => a.image) ?? articles[0];
  const secondary = articles
    .filter((a) => a.id !== lead?.id && a.image)
    .slice(0, 3);
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
          windowLabel={useDay ? "since midnight" : "last 24 hours"}
        />

        <div className="mt-16">{lead && <LeadCard article={lead} />}</div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_320px]">
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
