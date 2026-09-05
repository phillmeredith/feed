import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LeadCard, FeatureCard, ListCard } from "@/components/cards";
import { categories, categoryBySlug, groupBySlug, groups } from "@/lib/categories";
import { GroupPage } from "@/components/GroupPage";
import { getFeed } from "@/lib/feed";
import { withArchive } from "@/lib/archive";
import { gearDirectory } from "@/lib/gear";
import { getAllModelReleases } from "@/lib/models";
import { getPatents } from "@/lib/patents";
import { PatentsPanel } from "@/components/PatentsPanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { getDetailedWeather } from "@/lib/weather";
import { GearDirectory } from "@/components/GearDirectory";
import { ModelTable } from "@/components/ModelTable";

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

export function generateStaticParams() {
  return [
    ...groups.map((g) => ({ desk: g.slug })),
    ...categories.map((c) => ({ desk: c.slug })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/[desk]">): Promise<Metadata> {
  const { desk } = await params;
  const group = groupBySlug(desk);
  if (group) {
    return { title: `${group.label} — The Dispatch`, description: group.standfirst };
  }
  const category = categoryBySlug(desk);
  if (!category) return {};
  return {
    title: `${category.label} — The Dispatch`,
    description: category.standfirst,
  };
}

const PER_PAGE = 24;

export default async function DeskPage({
  params,
  searchParams,
}: PageProps<"/[desk]">) {
  const { desk } = await params;
  const page = Math.max(1, Number((await searchParams)?.page ?? 1) || 1);

  // A group slug renders an overview of the desks beneath it.
  const group = groupBySlug(desk);
  if (group) return <GroupPage group={group} />;

  const category = categoryBySlug(desk);
  if (!category) notFound();

  const { articles } = await getFeed();
  // Live stories merged over everything the archive holds for this desk.
  const deskArticles = withArchive(articles, category.slug);

  const totalPages = Math.max(1, Math.ceil(deskArticles.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageArticles = deskArticles.slice(
    (current - 1) * PER_PAGE,
    current * PER_PAGE
  );

  // Desk-specific reference material, below the reporting.
  const gear = category.slug === "cameras" ? gearDirectory(articles) : [];
  const models = category.slug === "ai" ? await getAllModelReleases(articles) : [];
  const patents = await getPatents(category.slug);
  const forecast =
    category.slug === "weather" ? await getDetailedWeather() : null;
  const [lead, ...rest] = pageArticles;
  const withArt = rest.filter((a) => a.image).slice(0, 6);
  const remainder = rest.filter((a) => !withArt.includes(a));

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)] text-accent">
            {category.label}
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            {category.standfirst}
          </p>
          <p className="kicker text-[10px] text-faint mt-5">
            {deskArticles.length} stories · refreshed every 10 minutes
            {totalPages > 1 && ` · page ${current} of ${totalPages}`}
          </p>
        </div>

        {forecast && (
          <div className="mt-10">
            <ForecastPanel weather={forecast} />
          </div>
        )}

        {lead ? (
          <>
            <div className="mt-10">
              <LeadCard article={lead} />
            </div>

            {withArt.length > 0 && (
              <div className="mt-14 border-t border-rule pt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {withArt.map((a) => (
                  <FeatureCard key={a.id} article={a} />
                ))}
              </div>
            )}

            {remainder.length > 0 && (
              <div className="mt-14">
                <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
                  Also on this desk
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*:first-child]:border-t-0 sm:[&>*:nth-child(-n+2)]:border-t-0 lg:[&>*:nth-child(-n+3)]:border-t-0">
                  {remainder.map((a) => (
                    <ListCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-16 font-serif italic text-xl text-muted">
            Nothing new on this desk right now. Check back after the next refresh.
          </p>
        )}
        {totalPages > 1 && (
          <nav className="mt-16 border-t border-rule pt-6 flex items-center justify-between kicker text-[10px]">
            {current > 1 ? (
              <Link
                href={`/${category.slug}?page=${current - 1}`}
                className="text-muted hover:text-accent transition-colors"
              >
                ← Newer
              </Link>
            ) : (
              <span className="text-faint">← Newer</span>
            )}
            <span className="text-faint">
              Page {current} of {totalPages}
            </span>
            {current < totalPages ? (
              <Link
                href={`/${category.slug}?page=${current + 1}`}
                className="text-muted hover:text-accent transition-colors"
              >
                Older →
              </Link>
            ) : (
              <span className="text-faint">Older →</span>
            )}
          </nav>
        )}

        {gear.length > 0 && <GearDirectory items={gear} />}
        {models.length > 0 && <ModelTable models={models} />}
        {patents.length > 0 && <PatentsPanel filings={patents} />}
      </main>

      <Footer />
    </>
  );
}
