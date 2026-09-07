import Link from "next/link";
import type { Article, Category } from "@/lib/types";
import { FeatureCard, ListCard, ThumbCard } from "./cards";

/**
 * The three shapes a block of a section can take.
 *
 * Both the front page and the section fronts are lists of blocks, and both
 * were rendering every block identically — eleven the same on the front page,
 * three the same on each section front. A page of one repeated shape reads as
 * a table of contents however good the writing in it is.
 *
 * Cycling them gives a page a rhythm: pictures, then a picture with the
 * reporting stacked beside it, then headlines in columns. They live here
 * rather than in either page so the two stay in the same language.
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
  showDesk?: boolean;
}) {
  if (articles.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="display text-2xl sm:text-3xl">
            <Link href={href} className="hover:text-accent transition-colors">
              {title}
            </Link>
          </h2>
          {dek && (
            <p className="font-serif italic text-accent text-sm mt-2">{dek}</p>
          )}
        </div>
        <Link
          href={href}
          className="kicker text-micro text-muted hover:text-accent transition-colors"
        >
          All {total ?? articles.length} stories →
        </Link>
      </div>

      {shape === "gallery" && <Gallery articles={articles} showDesk={showDesk} />}
      {shape === "split" && <Split articles={articles} />}
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

/** Pictures, three across. The desk with the strongest artwork leads. */
export function Gallery({
  articles,
  showDesk = false,
}: {
  articles: Article[];
  showDesk?: boolean;
}) {
  const withArt = articles.filter((a) => a.image).slice(0, 3);
  const rest = articles.filter((a) => !withArt.includes(a)).slice(0, 9);

  return (
    <>
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {withArt.map((a) => (
          <FeatureCard key={a.id} article={a} />
        ))}
      </div>
      {rest.length > 0 && (
        <div className="mt-10 grid gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <ListCard key={a.id} article={a} showDesk={showDesk} />
          ))}
        </div>
      )}
    </>
  );
}

/** One picture, and the desk's other reporting stacked beside it. */
export function Split({ articles }: { articles: Article[] }) {
  const feature = articles.find((a) => a.image) ?? articles[0];
  const rest = articles.filter((a) => a.id !== feature?.id).slice(0, 4);

  return (
    <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {feature && <FeatureCard article={feature} />}
      <div className="flex flex-col gap-5">
        {rest.map((a) => (
          <ThumbCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}

/**
 * Headlines only, in columns — a desk read as a list rather than browsed.
 *
 * On a section front this is a teaser and stops at nine. On a desk page it is
 * the rest of the page, and cutting it would drop stories that paging says
 * are there, so the caller raises the limit.
 */
export function Index({
  articles,
  limit = 9,
  showDesk = false,
}: {
  articles: Article[];
  limit?: number;
  /** On a section front, an item is only placeable if it names its desk. */
  showDesk?: boolean;
}) {
  return (
    <div className="mt-10 grid gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.slice(0, limit).map((a) => (
        <ListCard key={a.id} article={a} showDesk={showDesk} />
      ))}
    </div>
  );
}
