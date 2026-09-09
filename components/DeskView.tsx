import { notFound } from "next/navigation";
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { StackedLead } from "@/components/cards";
import { Gallery, Split, Index } from "@/components/shapes";
import { categoryBySlug, groupBySlug } from "@/lib/categories";
import { getFeed } from "@/lib/feed";
import { withArchive } from "@/lib/archive";
import { gearDirectory } from "@/lib/gear";
import { getAllModelReleases } from "@/lib/models";
import { ForecastPanel } from "@/components/ForecastPanel";
import { TodayVerdict } from "@/components/TodayVerdict";
import { WhereToGo } from "@/components/WhereToGo";
import { getPlaceForecasts, PLACES } from "@/lib/places";
import { getConfidence } from "@/lib/ensemble";
import { getDetailedWeather } from "@/lib/weather";
import { GearDirectory } from "@/components/GearDirectory";
import { ModelTable } from "@/components/ModelTable";
import { VideoPanel } from "@/components/VideoPanel";
import { recentVideos } from "@/lib/video";
import { PageHead } from "./PageHead";
import { BandHead, RailHead } from "./Band";
import { RelativeTime } from "./RelativeTime";
import { SectionBlock } from "./shapes";

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
  /** Which of the desk's tabs this is, so the tab bar can mark it. */
  tab = "",
  /**
   * How much of the article feed a tab carries.
   *
   * "full" is a news desk. "none" is a calendar or a table. "brief" is for a
   * desk whose own tab already holds the reporting — the sport desks each
   * have an Articles tab, and their landing page was rendering the entire
   * feed underneath the fixtures, duplicating the tab beside it and taking
   * nearly half the page to do it.
   */
  feed = "full",
  /**
   * Whether the desk's standing panels — the gear directory, the model
   * table — render underneath the feed. They have their own
   * tabs now; stacking them under the articles as well is the same
   * duplication the sport desks had.
   */
  panels = true,
}: {
  desk: string;
  page: number;
  above?: React.ReactNode;
  tab?: string;
  feed?: "full" | "brief" | "none";
  panels?: boolean;
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
  const forecast =
    panels && category.slug === "weather" ? await getDetailedWeather() : null;
  const places =
    panels && category.slug === "weather" ? await getPlaceForecasts() : [];
  const confidence =
    panels && category.slug === "weather"
      ? await getConfidence(PLACES[0].latitude, PLACES[0].longitude)
      : [];

  /*
   * Home first, then the places that differ most from it, so switching the
   * chart is a comparison rather than a list.
   */
  const series =
    places.length > 1
      ? [...places]
          .sort((a, b) =>
            a.name === "Newcastle" ? -1 : b.name === "Newcastle" ? 1 : 0
          )
          .filter((p) => p.hours.length > 1)
          .map((p) => ({ name: p.name, note: p.note, hours: p.hours }))
      : undefined;
  const group = category.group ? groupBySlug(category.group) : undefined;

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
  /*
   * A desk was a lead and then six identical cards and then a list. The same
   * shapes the fronts use give it somewhere to go instead: a lead with a rail
   * beside it, three across, one picture with the reporting beside it, then
   * the rest as headlines.
   *
   * The rail matters for more than variety. Without it the lead's picture ran
   * the width of the sheet — 16:9 across 1350px is seven hundred and fifty
   * pixels of photograph before a headline — and the page opened on a wall.
   */
  const [lead, ...rest] = pageArticles;
  const rail = rest.slice(0, 5);
  const afterRail = rest.slice(5);
  const gallery = afterRail.filter((a) => a.image).slice(0, 3);
  const afterGallery = afterRail.filter((a) => !gallery.includes(a));
  const split = afterGallery.slice(0, 4);
  const remainder = afterGallery.slice(4);

  return (
    <>
      <Masthead />

      <main className="sheet flex-1 w-full pb-24 pt-7">
        {/*
          * The three tiers, in the order they narrow: the section, the nav
          * that moves between its desks, then the desk itself and the tabs
          * within it. Reading down the page is reading down the hierarchy.
          */}
        <PageHead
          section={group ? { label: group.label, href: `/${group.slug}` } : undefined}
          subnav={
            category.group
              ? { group: category.group, current: category.slug }
              : undefined
          }
          title={category.label}
          standfirst={category.standfirst}
          meta={
            <>
              {deskArticles.length} stories · refreshed every 10 minutes
              {totalPages > 1 && ` · page ${current} of ${totalPages}`}
            </>
          }
          tabs={{ desk: category.slug, current: tab }}
        />

        {above}

        {/* The forecast belongs to the Forecast tab. Gated on the desk alone,
            it rendered on the climate tab and the articles tab as well, so
            every weather page opened on the same sixteen-day outlook. */}
        {panels &&
          category.slug === "weather" &&
          (forecast ? (
            <>
              {/* The answers first; everything under them is the working. */}
              <div className="mt-12">
                <TodayVerdict weather={forecast} confidence={confidence} />
              </div>
              <div className="mt-20">
                <ForecastPanel
                  weather={forecast}
                  series={series}
                  confidence={confidence}
                />
              </div>
              {places.length > 0 && (
                <div className="mt-20">
                  {/* The table needs the summary, not the hours — those go to
                      the chart, and sending them twice doubled the payload
                      for the six places to no purpose. */}
                  <WhereToGo
                    places={places.map((place) => ({
                      name: place.name,
                      note: place.note,
                      rainMm: place.rainMm,
                      peakChance: place.peakChance,
                      gustKph: place.gustKph,
                      cloud: place.cloud,
                    }))}
                  />
                </div>
              )}

            </>
          ) : (
            /* Losing the forecast used to remove half the page with no
               explanation; say so instead. */
            <p className="mt-12 standfirst font-serif text-xl italic">
              The forecast is unavailable right now — Open-Meteo didn&apos;t
              answer. The reporting below is unaffected.
            </p>
          ))}

        {feed === "brief" && rest.length > 0 && (
          <div className="mt-12">
            <SectionBlock
              title="Latest"
              dek="The reporting, in brief"
              href={`/${category.slug}/articles`}
              total={deskArticles.length}
              articles={[lead, ...rest].filter(Boolean).slice(0, 6)}
              shape="index"
            />
          </div>
        )}

        {/* A tab showing only a calendar or a table has no feed to run. */}
        {feed === "full" && (lead ? (
          <>
            {/*
              * A desk opener, not a front-page lead. `LeadCard` sets its
              * headline at the one size nothing outside the front page is
              * allowed to use — putting it on eleven desk pages as well is
              * what stops the front page reading as the front page.
              */}
            <div className="mt-12 grid gap-x-gutter gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <StackedLead article={lead} />

              {rail.length > 0 && (
                <aside className="border-t border-rule-strong pt-6 lg:border-t-0 lg:pt-0 lg:rule-l">
                  <RailHead>Also on this desk</RailHead>
                  <ol>
                    {rail.map((article) => (
                      <li
                        key={article.id}
                        className="group border-b border-rule py-4 last:border-b-0"
                      >
                        <Link
                          href={`/story/${article.id}`}
                          className="story block"
                        >
                          <h3 className="headline text-[1.2rem] font-medium leading-[1.18]">
                            {article.headline}
                          </h3>
                          <p className="source mt-2">
                            {article.source} ·{" "}
                            <RelativeTime iso={article.publishedAt} />
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </aside>
              )}
            </div>

            {gallery.length > 0 && (
              <div className="mt-14 border-t border-rule-strong pt-10">
                <Gallery articles={gallery} />
              </div>
            )}

            {split.length > 0 && (
              <div className="mt-14 border-t border-rule-strong pt-10">
                <Split articles={split} />
              </div>
            )}

            {remainder.length > 0 && (
              <div className="mt-14">
                <BandHead
                  weight="major"
                  title="The rest of the desk"
                  note={`Everything else ${category.label.toLowerCase()} has filed.`}
                />
                <Index articles={remainder} limit={remainder.length} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-12 standfirst font-serif text-xl italic">
            Nothing new on this desk right now. Check back after the next refresh.
          </p>
        ))}
        {totalPages > 1 && (
          <nav className="band-rule mt-14 flex items-center justify-between pt-4 kicker text-micro">
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

        {panels && videos.length > 0 && (
          <div className="mt-14">
            <VideoPanel
              videos={videos}
              title="On video"
              standfirst="The most recent coverage from the channels this desk follows — playable without leaving the page."
            />
          </div>
        )}

        {panels && gear.length > 0 && <GearDirectory items={gear} />}
        {panels && models.length > 0 && <ModelTable models={models} />}
      </main>

      <Footer />
    </>
  );
}
