import Link from "next/link";
import type { Group } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";
import { getFeed, pickHero } from "@/lib/feed";
import { withArchive } from "@/lib/archive";
import { recentVideos } from "@/lib/video";
import { relativeDate } from "@/lib/format";
import { Masthead } from "./Masthead";
import { Footer } from "./Footer";
import { SubNav } from "./SubNav";
import { GroupStanding } from "./GroupStanding";
import { VideoPanel } from "./VideoPanel";
import { StackedLead } from "./cards";
import { SpoilerHeadline } from "./SpoilerHeadline";
import { SpoilerToggle } from "./SpoilerGuard";
import { SHAPES, DeskBlock } from "./shapes";

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

  const desks = group.desks
    .map((slug) => ({
      category: categoryBySlug(slug)!,
      articles: withArchive(articles, slug),
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
  const lead = pickHero(everything, group.desks) ?? everything[0];
  const latest = everything.filter((a) => a.id !== lead?.id).slice(0, 6);

  const beat =
    group.slug === "photography"
      ? ("photography" as const)
      : group.slug === "technology"
        ? ("hardware" as const)
        : null;
  const videos = beat ? recentVideos(beat, 3) : [];

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-10 py-10 flex-1 w-full">
        <header className="border-b border-rule pb-8">
          <h1 className="display text-nameplate text-accent">
            {group.label}
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            {group.standfirst}
          </p>
          <SubNav group={group.slug} current={group.slug} />

          {/* Headlines can be masked here, so the way to unmask them has to be
              here too — a hidden headline with no switch beside it is a dead
              end. */}
          {group.slug === "sport" && (
            <div className="mt-6">
              <SpoilerToggle />
            </div>
          )}
        </header>

        {/*
         * The opener: one story at full size, and beside it what else has
         * happened across the section since. The rail is deliberately text —
         * a second column of pictures competes with the lead instead of
         * supporting it.
         */}
        {lead && (
          <div className="mt-14 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <StackedLead article={lead} />

            {latest.length > 0 && (
              <aside className="lg:border-l lg:border-rule lg:pl-12">
                <h2 className="kicker text-micro text-faint">
                  Also across {group.label.toLowerCase()}
                </h2>
                <ol className="mt-2">
                  {latest.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/story/${article.id}`}
                        className="group block py-4"
                      >
                        <h3 className="font-body text-small leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          <SpoilerHeadline article={article} />
                        </h3>
                        <p className="kicker text-micro text-faint mt-2">
                          <span className="text-accent">
                            {categoryBySlug(article.category)?.short}
                          </span>
                          <span className="mx-2 text-rule">/</span>
                          {relativeDate(article.publishedAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </div>
        )}

        <div className="mt-24">
          <GroupStanding group={group.slug} />
        </div>

        {/*
         * Each desk gets a different treatment, cycled by position: pictures,
         * then a picture with a list beside it, then headlines only. The
         * material doesn't vary enough to earn three identical grids.
         */}
        <div className="mt-24 flex flex-col gap-24">
          {desks.map((desk, index) => (
            <DeskBlock
              key={desk.category.slug}
              category={desk.category}
              articles={desk.articles.filter((a) => a.id !== lead?.id)}
              shape={SHAPES[index % SHAPES.length]}
            />
          ))}
        </div>

        {videos.length > 0 && (
          <div className="mt-24">
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
