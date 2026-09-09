import type { Article, Category } from "@/lib/types";
import { FeatureCard, ListCard, ThumbCard, RunItem } from "./cards";
import { BandHead } from "./Band";

/**
 * The three shapes a block of a section can take.
 *
 * Both the section fronts and the desk pages are lists of blocks, and both
 * were rendering every block identically — a page of one repeated shape reads
 * as a table of contents however good the writing in it is.
 *
 * Cycling them gives a page a rhythm: pictures, then a picture with the
 * reporting stacked beside it, then headlines in columns. They live here
 * rather than in either page so the two stay in the same language — and the
 * same language the front page speaks, which is ruled columns of equal width
 * under a banded head.
 */
export const SHAPES = ["gallery", "split", "index"] as const;
export type Shape = (typeof SHAPES)[number];

export function SectionBlock({
  title,
  dek,
  href,
  total,
  articles,
  shape,
  showDesk,
}: {
  title: string;
  dek?: string;
  href: string;
  total?: number;
  articles: Article[];
  shape: Shape;
  /**
   * Whether an item has to name its own desk. A block drawn from one desk
   * does not — the heading above it already did — and a block drawn from
   * several does, or a reader cannot place anything in it.
   */
  showDesk?: boolean;
}) {
  if (articles.length === 0) return null;

  return (
    <section>
      <BandHead
        title={title}
        note={dek}
        href={href}
        more={`All ${total ?? articles.length} stories`}
      />

      {shape === "gallery" && <Gallery articles={articles} showDesk={showDesk} />}
      {shape === "split" && <Split articles={articles} showDesk={showDesk} />}
      {shape === "index" && <Index articles={articles} showDesk={showDesk} />}
    </section>
  );
}

/** A desk's block on a section front, which knows its own category. */
export function DeskBlock({
  category,
  articles,
  shape,
}: {
  category: Category;
  articles: Article[];
  shape: Shape;
}) {
  return (
    <SectionBlock
      title={category.label}
      dek={category.dek}
      href={`/${category.slug}`}
      articles={articles}
      shape={shape}
    />
  );
}

/**
 * Pictures, three across, and a short index of the rest beneath.
 *
 * Ruled rather than gapped, and every column padded identically, so the three
 * pictures are the same width and their tops line up — the arrangement the
 * front page's briefs band settled on for the same reason.
 *
 * Only the first card carries a standfirst. Three of them side by side is
 * three paragraphs of grey competing with the three headlines above them,
 * and the block stops being a row of pictures and becomes a wall of text.
 */
export function Gallery({
  articles,
  showDesk = false,
}: {
  articles: Article[];
  showDesk?: boolean;
}) {
  const withArt = articles.filter((a) => a.image).slice(0, 3);
  const rest = articles.filter((a) => !withArt.includes(a)).slice(0, GALLERY_TAIL);

  return (
    <>
      <div className="ruled mt-8 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {withArt.map((a, i) => (
          <FeatureCard
            key={a.id}
            article={a}
            ratio="landscape"
            headline="text-[1.6rem] leading-[1.06]"
            showDek={i === 0}
            showKicker={showDesk}
          />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="ruled mt-10 grid gap-y-1 border-t border-rule-strong pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <ListCard key={a.id} article={a} showDesk={showDesk} />
          ))}
        </div>
      )}
    </>
  );
}

/** One picture, and the desk's other reporting stacked beside it on a rule. */
export function Split({
  articles,
  showDesk = false,
}: {
  articles: Article[];
  showDesk?: boolean;
}) {
  const feature = articles.find((a) => a.image) ?? articles[0];
  const rest = articles.filter((a) => a.id !== feature?.id).slice(0, 3);

  return (
    <div className="mt-8 grid gap-x-gutter gap-y-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {feature && (
        <FeatureCard
          article={feature}
          ratio="hero"
          headline="text-[1.85rem] leading-[1.05]"
          showKicker={showDesk}
        />
      )}
      <div className="md:rule-l">
        {rest.map((a) => (
          <ThumbCard key={a.id} article={a} showDesk={showDesk} />
        ))}
      </div>
    </div>
  );
}

/**
 * How many headlines a block will show before it starts being a list of
 * everything. Six is two rows of three, which is a block; nine was three
 * rows, which on a page carrying four of these blocks is most of the page.
 */
const INDEX_LIMIT = 6;

/**
 * What a gallery lists under its pictures. One row, so the block reads as
 * three pictures with a footnote rather than three pictures on top of a list
 * as long as they are tall.
 */
const GALLERY_TAIL = 3;

/**
 * Headlines only, in ruled columns — a desk read as a list rather than
 * browsed.
 *
 * On a section front this is a teaser and stops at six. On a desk page it is
 * the rest of the page, and cutting it would drop stories that paging says
 * are there, so the caller raises the limit.
 */
export function Index({
  articles,
  limit = INDEX_LIMIT,
  showDesk = false,
}: {
  articles: Article[];
  limit?: number;
  /** On a section front, an item is only placeable if it names its desk. */
  showDesk?: boolean;
}) {
  return (
    <div className="ruled mt-8 grid gap-y-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {articles.slice(0, limit).map((a) => (
        <ListCard key={a.id} article={a} showDesk={showDesk} />
      ))}
    </div>
  );
}

/**
 * A desk's own run: columns of headlines with the first item in each carrying
 * the picture — the front page's foot, reused where a page has a lot of one
 * desk to show at once rather than a little of six.
 *
 * Dealt down the columns rather than across, so reading a column top to
 * bottom is reading in order, which is what a column of a newspaper is for.
 */
export function Run({
  articles,
  columns = 4,
}: {
  articles: Article[];
  columns?: number;
}) {
  if (articles.length === 0) return null;

  const perColumn = Math.ceil(articles.length / columns);
  const dealt = Array.from({ length: columns }, (_, i) =>
    articles.slice(i * perColumn, (i + 1) * perColumn)
  ).filter((column) => column.length > 0);

  return (
    <div className="ruled grid grid-cols-1 items-start pt-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {dealt.map((column) => (
        <div key={column[0].id}>
          {column.map((article, n) => (
            <RunItem key={article.id} article={article} lead={n === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}
