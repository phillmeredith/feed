import { notFound } from "next/navigation";
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { categoryBySlug, groupBySlug } from "@/lib/categories";
import { getFeed } from "@/lib/feed";
import { withArchive, deskSplit, listing, PER_PAGE } from "@/lib/archive";
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
import { DeskFeed } from "./DeskFeed";

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

  /*
   * Whether this tab has any use for the wire.
   *
   * Ten of these routes are a calendar, a table or a directory — `feed="none"`
   * — and every one of them was fetching forty RSS feeds, extracting them and
   * resolving artwork in order to render a nameplate, a row of tabs and a
   * story count nobody had asked for. On the cached tabs that is three or four
   * seconds per rebuild, paid ten times over; on the games directory, which
   * reads a query string and so cannot be cached at all, it was three to four
   * seconds paid by every single reader. That is where the six-second
   * directory came from.
   *
   * So the feed is fetched when something on the page is made of it: the
   * article feed itself, or the two standing panels that are drawn from it.
   */
  const needsFeed =
    feed !== "none" ||
    (panels && (category.slug === "cameras" || category.slug === "ai"));

  const wire = needsFeed ? await getFeed() : null;
  const articles = wire?.articles ?? [];
  /*
   * Live stories merged over everything the archive holds for this desk, then
   * cut where the desk ends. A desk is two pages; what has fallen past them is
   * still here, under the Archive tab, and no longer underfoot.
   */
  const { live, overflow } = needsFeed
    ? deskSplit(withArchive(articles, category.slug))
    : { live: [], overflow: [] };

  const totalPages = Math.max(1, Math.ceil(live.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  /*
   * The page, and behind it the page after — the reserve the feed draws on
   * when the reader has already read some of this one. Paging still counts in
   * whole pages, so a reader who has filed half a desk away sees a page that
   * borrows from the next one and a count that does not pretend otherwise.
   *
   * Trimmed to what a card prints: all of this crosses to the browser, and a
   * publisher's syndicated body is tens of kilobytes nothing here will read.
   */
  const pageArticles = live
    .slice((current - 1) * PER_PAGE, current * PER_PAGE + PER_PAGE)
    .map(listing);

  /*
   * Desk-specific reference material, below the reporting — and gated on the
   * same flag that renders it. These were computed on every tab of the desk
   * and thrown away on the ones that do not draw them, which for the AI desk
   * meant resolving the whole model catalogue to render a calendar.
   */
  const gear =
    panels && category.slug === "cameras" ? gearDirectory(articles) : [];
  const models =
    panels && category.slug === "ai" ? await getAllModelReleases(articles) : [];
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
          /* A calendar or a directory has no story count, and printing the
             desk's one there was both wrong and the reason the page had to
             fetch the wire at all. */
          meta={
            !needsFeed ? undefined : (
            <>
              {live.length} on the desk · refreshed every 10 minutes
              {totalPages > 1 && ` · page ${current} of ${totalPages}`}
              {overflow.length > 0 && (
                <>
                  {" · "}
                  <Link
                    href={`/${category.slug}/archive`}
                    className="transition-colors hover:text-accent"
                  >
                    {overflow.length} filed
                  </Link>
                </>
              )}
            </>
            )
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

        {feed !== "none" && (
          <DeskFeed
            articles={pageArticles}
            show={PER_PAGE}
            label={category.label}
            slug={category.slug}
            total={live.length}
            mode={feed}
          />
        )}

        {/* The foot of the desk. Where a desk used to page on for ever, it now
            ends — and the way on from the last page is into its archive. */}
        {feed !== "none" && (totalPages > 1 || overflow.length > 0) && (
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
            ) : overflow.length > 0 ? (
              <Link
                href={`/${category.slug}/archive`}
                className="text-muted hover:text-accent transition-colors"
              >
                The archive →
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
