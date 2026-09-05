import { notFound } from "next/navigation";
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { LeadCard, FeatureCard, ListCard } from "@/components/cards";
import { categoryBySlug } from "@/lib/categories";
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
import { VideoPanel } from "@/components/VideoPanel";
import { referencesForDesk } from "@/lib/reference";
import { recentVideos } from "@/lib/video";
import { SubNav } from "./SubNav";

/*
 * One desk, one page of it.
 *
 * This lives apart from the route so that page one and the paged tail can be
 * two different routes rendering the same thing. Paging used to be a query
 * string, and reading one opts a route out of caching entirely — every visitor
 * paid three or four seconds of feed fetching so that a handful could reach
 * page two. The depth is a path segment now, and page one is cached.
 */
/** Page one has no segment; the rest live under /desk/page/n. */
export function pageHref(slug: string, n: number) {
  return n <= 1 ? `/${slug}` : `/${slug}/page/${n}`;
}

const PER_PAGE = 24;

export async function DeskView({
  desk,
  page,
  /** A desk's own standing material — a season, a leaderboard — above the news. */
  above,
}: {
  desk: string;
  page: number;
  above?: React.ReactNode;
}) {
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
  const deskReferences = referencesForDesk(category.slug);

  /*
   * Video is where most camera and hardware reviewing actually happens, so a
   * desk covering either is incomplete without it. It plays in the page.
   */
  const beat =
    category.slug === "cameras" ||
    category.slug === "lenses" ||
    category.slug === "technique"
      ? ("photography" as const)
      : category.slug === "hardware"
        ? ("hardware" as const)
        : null;
  const videos = beat ? recentVideos(beat, 6) : [];
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

          {category.group && (
            <SubNav group={category.group} current={category.slug} />
          )}

          {deskReferences.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {deskReferences.map((ref) => (
                <Link
                  key={ref.slug}
                  href={`/${ref.slug}`}
                  className="group border border-rule bg-surface px-4 py-3 hover:border-accent-dim transition-colors"
                >
                  <span className="kicker text-[9px] text-faint block">
                    {ref.label}
                  </span>
                  <span className="font-body font-semibold text-[15px] text-paper group-hover:text-accent transition-colors">
                    {ref.dek} →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {above}

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
                href={pageHref(category.slug, current - 1)}
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
                href={pageHref(category.slug, current + 1)}
                className="text-muted hover:text-accent transition-colors"
              >
                Older →
              </Link>
            ) : (
              <span className="text-faint">Older →</span>
            )}
          </nav>
        )}

        {videos.length > 0 && (
          <div className="mt-20">
            <VideoPanel
              videos={videos}
              title="On video"
              standfirst="The most recent coverage from the channels this desk follows — playable without leaving the page."
            />
          </div>
        )}

        {gear.length > 0 && <GearDirectory items={gear} />}
        {models.length > 0 && <ModelTable models={models} />}
        {patents.length > 0 && <PatentsPanel filings={patents} />}
      </main>

      <Footer />
    </>
  );
}
