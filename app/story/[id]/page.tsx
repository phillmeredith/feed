import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { Media } from "@/components/Media";
import { FeatureCard } from "@/components/cards";
import { relativeDate } from "@/lib/format";
import { categoryBySlug } from "@/lib/categories";
import { getStory } from "@/lib/feed";

export const revalidate = 600;
// Feed fetching and extraction need more than the default budget.
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: PageProps<"/story/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = await getStory(id);
  if (!found) return { title: "Story not found — The Dispatch" };
  return {
    title: `${found.story.headline} — The Dispatch`,
    description: found.story.dek,
  };
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  const found = await getStory(id);
  if (!found) notFound();

  const { story, related } = found;
  const desk = categoryBySlug(story.category);

  return (
    <>
      <Masthead compact />

      <main className="flex-1 w-full">
        {/* Opener: headline set large against the artwork, as in a print spread. */}
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-12 pb-12">
          <div
            className={
              story.image
                ? "grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start"
                : "max-w-4xl"
            }
          >
            <div>
              <h1
                className={
                  story.image
                    ? "headline text-title"
                    : "headline text-title"
                }
              >
                {story.headline}
              </h1>

              {/* Without artwork the standfirst carries the opener instead. */}
              {!story.image && story.dek && (
                <p className="font-serif text-xl sm:text-2xl leading-snug text-muted mt-6 max-w-2xl">
                  {story.dek}
                </p>
              )}

              {desk && (
                <Link
                  href={`/${desk.slug}`}
                  className="kicker text-label text-accent mt-6 inline-block hover:underline"
                >
                  {desk.label}
                </Link>
              )}
            </div>

            {story.image && <Media src={story.image} ratio="hero" fit="contain" className="lg:mt-2" />}
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 pb-20">
          <div className="grid gap-14 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-20">
            {/* Sidebar */}
            <aside className="order-2 lg:order-1">
              <div className="kicker text-micro text-faint border-b border-rule pb-3">
                From {story.source}
              </div>
              <p className="font-serif italic text-lg text-accent mt-3">
                {relativeDate(story.publishedAt)}
              </p>

            </aside>

            {/* Body — the publisher's own syndicated text where they provide it. */}
            <article className="order-1 lg:order-2 max-w-[68ch]">
              {story.body ? (
                <div
                  className="article-body dropcap"
                  dangerouslySetInnerHTML={{ __html: story.body }}
                />
              ) : (
                <p className="dropcap font-body text-lg leading-[1.75] text-paper">
                  {story.excerpt || story.dek}
                </p>
              )}

              {/*
                * The whole story is on this page, so leaving is a credit
                * rather than a call to action. This was an accent-filled
                * button — the loudest thing at the end of the article was an
                * invitation to go and read it somewhere else.
                */}
              <div className="mt-12 border-t border-rule pt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
                <p className="kicker text-micro text-faint">
                  Reporting by {story.source}
                  {story.words ? ` · ${story.words} words` : ""}
                </p>
                <a
                  href={story.url}
                  target="_blank"
                  rel="noreferrer"
                  className="kicker text-micro text-faint hover:text-accent transition-colors"
                >
                  Original ↗
                </a>
                {desk && (
                  <Link
                    href={`/${desk.slug}`}
                    className="kicker text-micro text-muted hover:text-accent transition-colors ml-auto"
                  >
                    ← Back to {desk.label}
                  </Link>
                )}
              </div>
            </article>
          </div>

          {related.length > 0 && (
            <section className="mt-24 border-t border-rule pt-10">
              <h2 className="display text-2xl sm:text-3xl">
                {desk ? `More from ${desk.label}` : "More from the desks"}
              </h2>
              <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {related.slice(0, 3).map((a) => (
                  <FeatureCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
