import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import {
  LeadCard,
  FeatureCard,
  RunItem,
  BriefCard,
  WireItem,
  Kicker,
  Meta,
} from "@/components/cards";
import { Plate } from "@/components/Media";
import { Slots } from "@/components/Slots";
import { categories, groups } from "@/lib/categories";
import {
  getFeed,
  pickHero,
  frontPageScore,
  isFrontPageFresh,
} from "@/lib/feed";
import type { Article } from "@/lib/types";
import Link from "next/link";

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

/**
 * Takes the next `count` stories nobody has used yet, one per outlet.
 *
 * The front page is assembled in passes down the sheet, and every pass has
 * the same two problems: not printing a story twice, and not letting a
 * newsroom that files eight things an hour take a whole column. Three
 * Samsung press releases out of five was the state of the old rail.
 */
function draw(
  pool: Article[],
  count: number,
  used: Set<string>,
  { oncePerSource = true }: { oncePerSource?: boolean } = {}
) {
  const sources = new Set<string>();
  const taken: Article[] = [];

  for (const article of pool) {
    if (taken.length === count) break;
    if (used.has(article.id)) continue;
    if (oncePerSource && sources.has(article.source)) continue;
    sources.add(article.source);
    used.add(article.id);
    taken.push(article);
  }

  return taken;
}

/**
 * How many reserves a slot group carries behind what it prints.
 *
 * The page is one cached document served to everyone, so it cannot know what
 * any one reader has read; what it can do is send more than it has room for.
 * Every group below draws its slots plus a couple of understudies — drawn
 * through the same `used` set, so no reserve is a story already printed
 * somewhere else on the sheet — and `Slots` decides in the browser which of
 * them a particular reader sees. File the lead away and the first reserve
 * takes the top of the page.
 *
 * Two. A number chosen against the tail of the sheet rather than the top of
 * it: every reserve drawn at the fold is a story the section columns at the
 * foot no longer have, and the quiet desks down there only file three or four
 * things a day.
 */
const SPARES = 2;

function bench(
  pool: Article[],
  count: number,
  used: Set<string>,
  spares = SPARES,
  opts?: { oncePerSource?: boolean }
) {
  return draw(pool, count + spares, used, opts);
}

/** `Slots` needs the ids in the same order as the children it is given. */
const ids = (articles: Article[]) => articles.map((a) => a.id);

export default async function Home() {
  const { articles, briefs } = await getFeed();

  /*
   * Everything below the lead is drawn from one of two orderings: by quality,
   * for the slots a picture has to fill, and by clock, for the slots that are
   * simply what has come in. Sorting once here beats sorting per section.
   */
  const FRONT_PAGE_BAR = 3;
  const byQuality = (a: Article, b: Article) =>
    frontPageScore(b) - frontPageScore(a) ||
    b.publishedAt.localeCompare(a.publishedAt);

  const worthy = articles.filter(
    (a) => a.image && frontPageScore(a) >= FRONT_PAGE_BAR
  );
  const recent = worthy.filter(isFrontPageFresh);
  // Relax the window rather than run the fold short on a quiet week.
  const illustrated = (recent.length >= 6 ? recent : worthy).sort(byQuality);
  const newest = [...articles].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  /*
   * The wire has its own rail down the left of the fold, so its stories are
   * spoken for before anything else draws — otherwise the same piece prints
   * twice, once in the rail and once in a column beside it.
   */
  const WIRE_ITEMS = 6;
  const used = new Set<string>();
  /*
   * No per-outlet cap here, unlike everywhere else on the sheet: the wire is
   * already capped at two per outlet when it is ranked, and a rail that is
   * strictly one apiece is a rail that drops the second ProPublica piece of
   * the day for a weaker one from somewhere else.
   */
  const wire = bench(briefs, WIRE_ITEMS, used, 3, { oncePerSource: false });

  /*
   * The fold, in the order a reader's eye crosses it. The second lead is the
   * strongest illustrated story that isn't the lead; the two under the lead
   * are the next two; the stack beside the second lead is text.
   *
   * The hero picks itself; its reserves are simply the next best illustrated
   * stories, which is what the second lead would otherwise have been.
   */
  const hero = pickHero(articles);
  if (hero) used.add(hero.id);
  const lead = [hero, ...bench(illustrated, 0, used, SPARES)].filter(
    (a): a is Article => Boolean(a)
  );

  const second = bench(illustrated, 1, used);
  const subRun = bench(illustrated, 2, used);
  const stack = bench(newest.filter((a) => frontPageScore(a) > 0), 3, used);

  /*
   * The briefs band: five columns across the foot of the fold, each a picture
   * over two headlines. Drawn by clock rather than by quality — the band's
   * job is to say what else has happened — except for the five that head a
   * column, which have to have artwork or the row of pictures has a gap in it.
   *
   * A column is two slots, so it is drawn as two slots: five leads and five
   * reserve leads, five seconds and five reserve seconds, dealt so that column
   * three's reserve can only ever appear in column three. A single pool shared
   * across the band would let one column's promotion empty the next one.
   */
  const BRIEF_COLUMNS = 5;
  const filed = newest.filter((a) => frontPageScore(a) > 0);
  const briefLeads = bench(
    filed.filter((a) => a.image),
    BRIEF_COLUMNS,
    used,
    BRIEF_COLUMNS
  );
  const briefRest = bench(filed, BRIEF_COLUMNS, used, BRIEF_COLUMNS);
  const briefColumns = Array.from({ length: BRIEF_COLUMNS }, (_, i) => ({
    lead: [briefLeads[i], briefLeads[BRIEF_COLUMNS + i]].filter(Boolean),
    rest: [briefRest[i], briefRest[BRIEF_COLUMNS + i]].filter(Boolean),
  })).filter((column) => column.lead.length > 0);

  /*
   * The dwell: one story given the room to be read rather than scanned.
   *
   * It is the only three-column thing on the page, and the third of those
   * columns is the reporting — so a story with no standfirst leaves a third
   * of the section blank. Artwork and a standfirst are both entry conditions
   * here, unlike everywhere else on the sheet, where either can be missing
   * and the layout closes up around it. Which goes for its reserves too.
   */
  const dwell = bench(
    illustrated.filter((a) => a.dek),
    1,
    used
  );

  /*
   * The run at the foot of the page: one column per section, in nav order,
   * each pointing back at its own front. This replaced eleven full-width
   * blocks — one per desk, all the same shape, ten thousand pixels of
   * identical grids with no way to tell that AI and Hardware are two halves
   * of one section. Six columns says the same thing in one screen.
   */
  const grouped = new Set(groups.flatMap((g) => g.desks));
  const sections = [
    ...groups.map((group) => ({
      title: group.label,
      href: `/${group.slug}`,
      desks: group.desks as string[],
    })),
    ...categories
      .filter((c) => !grouped.has(c.slug) && c.slug !== "wire")
      .map((category) => ({
        title: category.label,
        href: `/${category.slug}`,
        desks: [category.slug as string],
      })),
  ].map((section) => {
    const pool = articles.filter((a) => section.desks.includes(a.category)).sort(byQuality);
    /*
     * The column's lead carries its only picture, so it is drawn from the
     * illustrated stories first and only falls back to the section's best
     * unillustrated one when the desk has no artwork at all. Drawing straight
     * down `byQuality` instead gave whole columns a text lead while a
     * perfectly good photograph sat two rows below it.
     *
     * A section with one prolific outlet is allowed to repeat that outlet
     * here: printing an empty column rather than a second Electrek piece is
     * the wrong trade this far down the page.
     *
     * One reserve apiece, not two. These are the last columns to draw and the
     * quietest desks in the paper; taking three stories out of a desk that
     * filed four to keep two in reserve empties the column it was protecting.
     */
    const opts = { oncePerSource: false };
    const illustratedHere = pool.filter((a) => a.image);
    const top = bench(
      illustratedHere.length > 0 ? illustratedHere : pool,
      1,
      used,
      1,
      opts
    );
    const rest = bench(pool, 2, used, 2, opts);

    return { ...section, total: pool.length, top, rest };
  });

  return (
    <>
      <Masthead stories={articles.length} />

      <main className="sheet flex-1 pb-28">
        {/* ===== THE FOLD ===== */}
        <section className="grid grid-cols-1 gap-x-gutter pt-[clamp(28px,3.4vw,56px)] xl:grid-cols-[0.9fr_2.6fr_1.15fr]">
          {/*
            * The wire rail. It runs first in the source so a screen reader and
            * a phone both get the day's most important independent reporting
            * before the lead's picture — and last visually on a phone, where a
            * six-item list above the lead would bury it.
            */}
          <div className="order-3 mt-10 border-t border-rule-strong pt-6 xl:order-none xl:mt-0 xl:border-t-0 xl:pt-0 xl:rule-r">
            <h2 className="kicker mb-4 border-b-2 border-ink pb-2.5 text-micro tracking-[0.22em]">
              The Wire
            </h2>
            <ol className="wire-order grid gap-x-gutter sm:grid-cols-2 xl:grid-cols-1">
              <Slots ids={ids(wire)} show={WIRE_ITEMS}>
                {wire.map((article) => (
                  <WireItem key={article.id} article={article} />
                ))}
              </Slots>
            </ol>
            <Link
              href="/wire"
              className="kicker mt-4 inline-block text-micro text-muted transition-colors hover:text-accent"
            >
              More from the wire →
            </Link>
          </div>

          <div className="order-1 xl:order-none">
            <Slots ids={ids(lead)} show={1}>
              {lead.map((article) => (
                <LeadCard key={article.id} article={article} />
              ))}
            </Slots>

            {subRun.length > 0 && (
              <div className="ruled mt-10 grid gap-y-10 border-t border-rule-strong pt-8 sm:grid-cols-2">
                <Slots ids={ids(subRun)} show={2}>
                  {subRun.map((article) => (
                    <FeatureCard
                      key={article.id}
                      article={article}
                      ratio="landscape"
                      headline="text-[1.85rem] leading-[1.05]"
                    />
                  ))}
                </Slots>
              </div>
            )}
          </div>

          <div className="order-2 mt-10 border-t border-rule-strong pt-8 xl:order-none xl:mt-0 xl:border-t-0 xl:pt-0 xl:rule-l">
            <Slots ids={ids(second)} show={1}>
              {second.map((article) => (
                <FeatureCard
                  key={article.id}
                  article={article}
                  ratio="standard"
                  headline="text-[1.75rem] leading-[1.03]"
                />
              ))}
            </Slots>

            {stack.length > 0 && (
              <div className="mt-8 border-t-2 border-ink pt-1">
                <Slots ids={ids(stack)} show={3}>
                  {stack.map((article) => (
                    <article
                      key={article.id}
                      className="group border-b border-rule py-4 last:border-b-0"
                    >
                      <Link href={`/story/${article.id}`} className="story block">
                        <Kicker article={article} mute className="mb-1.5" />
                        <h4 className="headline text-[1.3rem] font-medium leading-[1.18]">
                          {article.headline}
                        </h4>
                        <Meta article={article} className="mt-2" />
                      </Link>
                    </article>
                  ))}
                </Slots>
              </div>
            )}
          </div>
        </section>

        {/* ===== IN BRIEF ===== */}
        {briefColumns.length > 0 && (
          <section className="band-rule mt-14 border-b border-ink pt-4 pb-8">
            <h2 className="kicker mb-6 text-micro tracking-[0.26em] text-muted">
              In brief · across the desks
            </h2>
            <div className="ruled grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {briefColumns.map((column, i) => (
                <div
                  key={column.lead[0].id}
                  /* Stacked, the columns need a rule between them in the one
                     direction the ruled grid cannot draw. */
                  className={i > 0 ? "border-t border-rule pt-3 sm:border-t-0 sm:pt-0" : undefined}
                >
                  <Slots ids={ids(column.lead)} show={1}>
                    {column.lead.map((article) => (
                      <BriefCard key={article.id} article={article} lead />
                    ))}
                  </Slots>
                  <Slots ids={ids(column.rest)} show={1}>
                    {column.rest.map((article) => (
                      <BriefCard key={article.id} article={article} />
                    ))}
                  </Slots>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== THE DWELL ===== */}
        {dwell.length > 0 && (
          <section className="py-[clamp(48px,5vw,84px)]">
            <Slots ids={ids(dwell)} show={1}>
              {dwell.map((article) => (
                <article key={article.id} className="group">
                  <Link href={`/story/${article.id}`} className="story block">
                    {/*
                      * One row: the headline, a plate, and the reporting. The
                      * picture sits between the two columns of type rather than
                      * over them — small enough to be read as a plate set into
                      * the page, which is the one thing on the sheet that a
                      * full-width photograph cannot be.
                      */}
                    <div className="grid items-start gap-x-gutter gap-y-8 md:grid-cols-[1.3fr_auto_1fr]">
                      <div>
                        <Kicker article={article} className="mb-5" />
                        <h2 className="headline text-[clamp(2rem,3.4vw,3.4rem)] font-normal leading-[1.04]">
                          {article.headline}
                        </h2>
                      </div>

                      {article.image && (
                        <Plate
                          src={article.image}
                          credit={article.source}
                          ratio="landscape"
                          sizes="(max-width: 768px) 100vw, 320px"
                          className="w-full max-w-[20rem] md:w-[clamp(190px,17vw,320px)]"
                        />
                      )}

                      <div className="border-t border-rule pt-5 md:border-t-0 md:pt-0 md:rule-l">
                        {article.dek && (
                          <p className="standfirst text-[1.2rem] leading-[1.58]">
                            {article.dek}
                          </p>
                        )}
                        <Meta article={article} className="mt-6" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </Slots>
          </section>
        )}

        {/* ===== ALSO ON THE DESKS ===== */}
        <div className="band-rule flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-rule-strong pt-4 pb-3.5">
          <h2 className="kicker text-micro tracking-[0.26em] text-muted">
            Also on the desks
          </h2>
          <p className="font-serif text-lede font-light italic text-faint">
            Everything else filed since this morning.
          </p>
          <span className="kicker ml-auto text-micro tracking-[0.15em] text-faint">
            {articles.length} stories in all
          </span>
        </div>

        <section className="ruled grid grid-cols-1 items-start pt-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {sections
            .filter((section) => section.top.length + section.rest.length > 0)
            .map((section, i) => (
              <div
                key={section.href}
                className={
                  i > 0 ? "mt-8 border-t border-rule pt-5 sm:mt-0 sm:border-t-0 sm:pt-0" : undefined
                }
              >
                <Link
                  href={section.href}
                  className="story group mb-4 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2"
                >
                  <h3 className="kicker text-micro tracking-[0.2em]">
                    {section.title}
                  </h3>
                  <span className="kicker text-micro text-faint">
                    {section.total} →
                  </span>
                </Link>

                <Slots ids={ids(section.top)} show={1}>
                  {section.top.map((article) => (
                    <RunItem key={article.id} article={article} lead />
                  ))}
                </Slots>
                <Slots ids={ids(section.rest)} show={2}>
                  {section.rest.map((article) => (
                    <RunItem key={article.id} article={article} />
                  ))}
                </Slots>
              </div>
            ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
