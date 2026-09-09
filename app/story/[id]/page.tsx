import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { Plate } from "@/components/Media";
import { FeatureCard } from "@/components/cards";
import { BandHead, RailHead } from "@/components/Band";
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
      <Masthead />

      <main className="flex-1 w-full">
        {/*
          * The opener, on the same two-column head every interior page uses:
          * the desk in oxide above, the headline across the measure it needs,
          * and the picture on a rule beside it with its credit under it.
          */}
        <div className="sheet pt-8 pb-10">
          {desk && (
            <Link href={`/${desk.slug}`} className="story inline-block">
              <h2 className="kicker text-micro tracking-[0.24em] text-accent">
                {desk.label}
              </h2>
            </Link>
          )}

          <div
            className={`band-rule mt-6 grid items-start gap-x-gutter gap-y-8 pt-8 ${
              story.image ? "lg:grid-cols-[1.1fr_1fr]" : ""
            }`}
          >
            <div className={story.image ? "" : "max-w-4xl"}>
              <h1 className="headline text-title">{story.headline}</h1>

              {/* With artwork the standfirst repeats the opening line of the
                  story two centimetres above it; without artwork it is the
                  only thing holding the head together. */}
              {!story.image && story.dek && (
                <p className="standfirst mt-6 max-w-2xl text-[1.3rem] leading-[1.5]">
                  {story.dek}
                </p>
              )}
            </div>

            {story.image && (
              <Plate
                src={story.image}
                credit={story.source}
                ratio="hero"
                fit="contain"
                className="lg:rule-l"
              />
            )}
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 pb-20">
          <div className="grid gap-14 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-20">
            {/* Sidebar */}
            <aside className="order-2 lg:order-1">
              <RailHead>From {story.source}</RailHead>
              <p className="font-serif text-lg italic text-muted">
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
                <p className="dropcap font-body text-lg leading-[1.75] text-ink">
                  {story.excerpt || story.dek}
                </p>
              )}

              {/*
                * The whole story is on this page, so leaving is a credit
                * rather than a call to action. This was an accent-filled
                * button — the loudest thing at the end of the article was an
                * invitation to go and read it somewhere else.
                */}
              <div className="band-rule mt-12 flex flex-wrap items-baseline gap-x-6 gap-y-3 pt-5">
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
            <section className="mt-20">
              <BandHead
                title={desk ? `More from ${desk.label}` : "More from the desks"}
                note="Filed on the same desk."
                href={desk ? `/${desk.slug}` : undefined}
                more="The whole desk"
              />
              <div className="ruled mt-8 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {related.slice(0, 3).map((a) => (
                  <FeatureCard
                    key={a.id}
                    article={a}
                    ratio="landscape"
                    headline="text-[1.5rem] leading-[1.07]"
                  />
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
