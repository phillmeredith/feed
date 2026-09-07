import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LeadCard, FeatureCard, ListCard } from "@/components/cards";
import { SectionBlock, SHAPES } from "@/components/shapes";
import { BriefsColumn } from "@/components/BriefsColumn";
import { categories, groups } from "@/lib/categories";
import { getFeed, pickHero, frontPageScore } from "@/lib/feed";
import type { Article } from "@/lib/types";

/*
 * Served from the cached copy and rebuilt every ten minutes.
 *
 * This page was rendered per request for a while, because Next's default is to
 * hand over the stale page and rebuild behind it — on a quiet site that meant
 * the reader always saw the previous version. But rendering costs three to
 * four seconds: forty feeds, extraction, artwork. Paying that on every visit
 * to avoid staleness was the wrong trade once the refresh workflow existed.
 *
 * The ten-minute cron is now the visitor who eats the rebuild. It requests
 * every desk on the same interval as this window, so the cached copy a reader
 * gets is never more than a cycle old — and it arrives immediately.
 */
export const revalidate = 600;
// The cron's own render still fetches and extracts.
export const maxDuration = 60;

export default async function Home() {
  const { articles, briefs } = await getFeed();

  const lead = pickHero(articles);

  /*
   * The three cards under the lead are the rest of the first impression, so
   * they come from three different places. Recency alone would hand them to
   * whichever outlet filed a burst in the last hour; desk diversity alone —
   * which is what this did before — forces a pick from every desk whether or
   * not that desk has anything, and quietly promotes a refrigerator software
   * update because hardware had to be represented.
   *
   * So: only stories worth a front page are eligible at all, and among those
   * a new desk is preferred rather than required.
   */
  const FRONT_PAGE_BAR = 3;
  /* Three days. A front page carrying a five-week-old story is not a front
     page, however good the story was in August. */
  const FRESH_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const byQuality = (a: Article, b: Article) =>
    frontPageScore(b) - frontPageScore(a) ||
    b.publishedAt.localeCompare(a.publishedAt);

  const worthy = articles.filter(
    (a) => a.image && frontPageScore(a) >= FRONT_PAGE_BAR
  );
  const recent = worthy.filter(
    (a) => now - new Date(a.publishedAt).getTime() < FRESH_MS
  );
  // Relax the window rather than run three cards short on a quiet week.
  const eligible = (recent.length >= 3 ? recent : worthy).sort(byQuality);

  const secondary: Article[] = [];
  const usedSources = new Set([lead?.source]);
  const usedDesks = new Set([lead?.category]);

  for (const requireNewDesk of [true, false]) {
    for (const a of eligible) {
      if (secondary.length === 3) break;
      if (a.id === lead?.id) continue;
      if (secondary.some((s) => s.id === a.id)) continue;
      if (usedSources.has(a.source)) continue;
      if (requireNewDesk && usedDesks.has(a.category)) continue;
      secondary.push(a);
      usedSources.add(a.source);
      usedDesks.add(a.category);
    }
  }
  const featuredIds = new Set([lead?.id, ...secondary.map((a) => a.id)]);

  /*
   * The rail beneath. One item per outlet, or a newsroom filing eight things
   * an hour takes the whole column — three Samsung press releases out of five
   * was the state of it. The wire's own rail is excluded so the two columns
   * beside each other don't print the same story twice.
   */
  const briefIds = new Set(briefs.slice(0, 6).map((a) => a.id));
  const seenSources = new Set<string>();
  const latest: Article[] = [];
  for (const a of [...articles].sort((x, y) =>
    y.publishedAt.localeCompare(x.publishedAt)
  )) {
    if (latest.length === 8) break;
    if (featuredIds.has(a.id) || briefIds.has(a.id)) continue;
    if (seenSources.has(a.source)) continue;
    if (frontPageScore(a) === 0) continue;
    seenSources.add(a.source);
    latest.push(a);
  }

  const shownAbove = new Set([...featuredIds, ...latest.map((a) => a.id)]);

  /*
   * Sections in nav order: the grouped ones first, then the desks that stand
   * alone. The wire is left out — it has its own rail at the top of the page,
   * and printing it twice is how the old front page filled its length.
   */
  const grouped = new Set(groups.flatMap((g) => g.desks));
  const fronts = [
    ...groups.map((group) => ({
      title: group.label,
      dek: group.dek,
      href: `/${group.slug}`,
      desks: group.desks as string[],
    })),
    ...categories
      .filter((c) => !grouped.has(c.slug) && c.slug !== "wire")
      .map((category) => ({
        title: category.label,
        dek: category.dek,
        href: `/${category.slug}`,
        desks: [category.slug as string],
      })),
  ].map((front) => {
    const pool = articles.filter((a) => front.desks.includes(a.category));
    return {
      ...front,
      total: pool.length,
      articles: pool.filter((a) => !shownAbove.has(a.id)),
    };
  });

  return (
    <>
      <Masthead />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-10 py-12 flex-1 w-full">
        {lead && <LeadCard article={lead} />}

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

        {/*
         * The rest of the front page, by section rather than by desk.
         *
         * This was eleven blocks, one per desk, all the same shape — ten
         * thousand pixels of identical grids, and no way to tell from the page
         * that AI and Hardware are two halves of one section. Grouping them
         * the way the nav does cuts it to six, gives each block the whole
         * section to pick its strongest four from, and points at the section
         * front rather than a single desk.
         */}
        <div className="mt-24 flex flex-col gap-24">
          {fronts.map((front, index) => (
            <SectionBlock
              key={front.href}
              title={front.title}
              dek={front.dek}
              href={front.href}
              total={front.total}
              articles={front.articles}
              shape={SHAPES[index % SHAPES.length]}
            />
          ))}
        </div>

      </main>

      <Footer />
    </>
  );
}
