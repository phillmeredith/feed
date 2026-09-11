import Link from "next/link";
import type { Group } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";
import { getFeed, pickHero } from "@/lib/feed";
import { withArchive, listing } from "@/lib/archive";
import { recentVideos } from "@/lib/video";
import { Masthead } from "./Masthead";
import { Footer } from "./Footer";
import { PageHead } from "./PageHead";
import { RailHead } from "./Band";
import { GroupStanding } from "./GroupStanding";
import { SportBoard } from "./SportBoard";
import { VideoPanel } from "./VideoPanel";
import { StackedLead } from "./cards";
import { RelativeTime } from "./RelativeTime";
import { SHAPES } from "@/lib/shapes";
import { DeskBlock, SectionBlock } from "./shapes";
import { Slots } from "./Slots";

/**
 * A section front.
 *
 * The first version of this page was a lead story and then one identical
 * block per desk, which is a table of contents pretending to be a page: three
 * headings, three feature cards, three lists, nothing to tell you which desk
 * you were looking at except the word at the top.
 *
 * A section front should do two things a desk page can't. It should say where
 * the subject itself stands — what has been released, who is winning — and it
 * should give each desk a different shape, so the page has a rhythm and the
 * eye knows it has moved. Both of those are here; neither was.
 */
export async function GroupPage({ group }: { group: Group }) {
  const { articles } = await getFeed();

  /*
   * Trimmed to what a card prints. The blocks below are client components —
   * they have to be, to know what the reader has read — so a desk's whole
   * list crosses to the browser, and a syndicated body is tens of kilobytes
   * that nothing on a section front will ever render.
   */
  const desks = group.desks
    .map((slug) => ({
      category: categoryBySlug(slug)!,
      articles: withArchive(articles, slug).map(listing),
    }))
    .filter((d) => d.category && d.articles.length > 0);

  const everything = desks
    .flatMap((d) => d.articles)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  /*
   * The same rota the front page uses, scoped to this section — so a section
   * front turns over through the day the way the front page does, instead of
   * pinning whichever desk filed most recently.
   */
  const hero = pickHero(everything, group.desks) ?? everything[0];
  /*
   * The opener carries two reserves behind it, and the rail three, for the
   * reader who has already read the section's best story — the same bench the
   * front page keeps. The reserves are held out of the rail and the desk
   * blocks below as well, or promoting one would print it twice.
   */
  const RAIL_ITEMS = 5;
  const lead = [hero, ...everything.filter((a) => a.id !== hero?.id).slice(0, 2)]
    .filter(Boolean)
    .slice(0, 3);
  const spoken = new Set(lead.map((a) => a.id));
  /*
   * Five, not six. The rail runs beside the lead's picture and every item in
   * it costs three lines — a desk, a headline and a credit — so it was a
   * column of small grey type as tall as the photograph next to it and just
   * as loud.
   */
  const latest = everything
    .filter((a) => !spoken.has(a.id))
    .slice(0, RAIL_ITEMS + 3);

  const beat =
    group.slug === "photography"
      ? ("photography" as const)
      : group.slug === "technology"
        ? ("hardware" as const)
        : null;
  const videos = beat ? recentVideos(beat, 3) : [];

  return (
    <>
      <Masthead />

      <main className="sheet flex-1 w-full pb-24 pt-7">
        <PageHead
          title={group.label}
          standfirst={group.standfirst}
          meta={`${everything.length} stories across ${desks.length} desks`}
          subnav={{ group: group.slug, current: group.slug }}
        />

        {/*
         * Sport opens on fixtures, not on a story.
         *
         * A section front whose first screen is a lead story works for
         * Technology and Photography, where the news is the subject. It does
         * not work for sport, where the subject is what is on and what just
         * happened — this page used to lead on a golf wedge review and put
         * the results two and a half thousand pixels down.
         */}
        {group.slug === "sport" && (
          <div className="mt-12">
            <SportBoard />
          </div>
        )}

        {/*
         * The opener: one story at full size, and beside it what else has
         * happened across the section since. The rail is deliberately text —
         * a second column of pictures competes with the lead instead of
         * supporting it.
         */}
        {/*
         * Sport has no separate lead block. The board is the anchor of the
         * page, and putting a full-width opener under it gave one article —
         * a driver-ratings listicle, as it happened — seven hundred and fifty
         * pixels while the twelve stories below it shared three hundred.
         */}
        {group.slug !== "sport" && lead.length > 0 && (
          <div className="mt-12 grid gap-x-gutter gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Slots ids={lead.map((a) => a.id)} show={1}>
              {lead.map((article) => (
                <StackedLead key={article.id} article={article} />
              ))}
            </Slots>

            {latest.length > 0 && (
              <aside className="border-t border-rule-strong pt-6 lg:border-t-0 lg:pt-0 lg:rule-l">
                <RailHead>Also across {group.label.toLowerCase()}</RailHead>
                <ol>
                  <Slots ids={latest.map((a) => a.id)} show={RAIL_ITEMS}>
                    {latest.map((article) => (
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
                          {/* The desk and the hour, and no outlet. The rail's
                              job is to say what else has happened across the
                              section — which desk it happened on is the useful
                              half, and printing the credit as well made every
                              item a three-line entry. */}
                          <p className="source mt-2">
                            {categoryBySlug(article.category)?.short} ·{" "}
                            <RelativeTime iso={article.publishedAt} />
                          </p>
                        </Link>
                      </li>
                    ))}
                  </Slots>
                </ol>
              </aside>
            )}
          </div>
        )}

        {group.slug !== "sport" && (
          <div className="mt-16">
            <GroupStanding group={group.slug} />
          </div>
        )}

        {/*
         * Each desk gets a different treatment, cycled by position: pictures,
         * then a picture with a list beside it, then headlines only. The
         * material doesn't vary enough to earn three identical grids.
         *
         * Sport is the exception: its board already says what is on in each
         * of the three, so repeating the desks below as three more blocks
         * says it a second time at length. The reading there is one column,
         * ranked across all three, with the desk marked on each item.
         */}
        {group.slug === "sport" ? (
          <div className="mt-16">
            <SectionBlock
              title="The reading"
              dek="Across all three desks"
              href="/sport"
              total={everything.length}
              articles={everything.slice(0, 13)}
              shape="gallery"
              showDesk
            />
          </div>
        ) : (
          <div className="mt-16 flex flex-col gap-16">
            {desks.map((desk, index) => (
              <DeskBlock
                key={desk.category.slug}
                category={desk.category}
                articles={desk.articles.filter((a) => !spoken.has(a.id))}
                shape={SHAPES[index % SHAPES.length]}
              />
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="mt-16">
            <VideoPanel
              videos={videos}
              title="On video"
              standfirst="Reviews from the channels this section follows, playable here."
            />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
