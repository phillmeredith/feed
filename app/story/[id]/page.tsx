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

      <main className="sheet flex-1 w-full pb-20 pt-7">
        {/*
          * One grid for the whole story, which took three attempts to get
          * right.
          *
          * The opener and the body used to be separate blocks — the opener
          * across the full sheet, the body a centred 1120px column — and the
          * page had four different left edges as a result: the headline at
          * 46px, the byline rail at 192, the prose at 512 and the picture at
          * 768, none of them agreeing with any other. On a page whose whole
          * subject is one article that is simply wrong.
          *
          * So: two columns, and everything belongs to one of them. The
          * headline and the byline under it run down the left; the picture
          * and the prose under it run down the right. The rule between them
          * is the article's own margin, and it runs the length of the page.
          */}
        {desk && (
          <Link href={`/${desk.slug}`} className="story inline-block">
            <h2 className="kicker text-micro tracking-[0.24em] text-accent">
              {desk.label}
            </h2>
          </Link>
        )}

        {/*
          * The rule spans the sheet, like every other rule on the site. It was
          * capped with the content for a while, which left it stopping short
          * of the masthead's rule above it with a hand's width of paper to the
          * right of it and nothing to explain why.
          *
          * The article takes about two thirds of the sheet and runs flush to
          * its right edge; the headline and the credit hold the margin down
          * the left, which is what the margin of a broadsheet is for.
          *
          * The picture fills that column and the prose does not — it stops at
          * a measure a person can actually read, left-aligned, so it begins on
          * the same line as the picture above it. A picture running wider than
          * the text beneath it is ordinary on a page; a picture starting in a
          * different place from it is not.
          */}
        <div className="band-rule mt-6 pt-8">
          <div className="grid items-start gap-x-gutter gap-y-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {/*
              * The left column: the headline, and beneath it the standing
              * credit — which is where a byline goes on a printed page, and
              * why it now begins on the same line as the headline rather than
              * a third of the way across the page from it.
              */}
            <div>
              <h1 className="headline text-title">{story.headline}</h1>

              {/* With artwork the standfirst repeats the opening line of the
                  story two centimetres above it; without artwork it is the
                  only thing holding the head together. */}
              {!story.image && story.dek && (
                <p className="standfirst mt-6 max-w-[34em] text-[1.3rem] leading-[1.5]">
                  {story.dek}
                </p>
              )}

              <div className="mt-9 max-w-[22rem]">
                <RailHead>From {story.source}</RailHead>
                <p className="font-serif text-lg italic text-muted">
                  {relativeDate(story.publishedAt)}
                </p>
                {story.byline && (
                  <p className="source mt-3">{story.byline}</p>
                )}
              </div>
            </div>

            {/* The right column: the picture, and the reporting under it. */}
            <div className="lg:rule-l">
              {story.image && (
                <Plate
                  src={story.image}
                  credit={story.source}
                  ratio="hero"
                  fit="contain"
                  className="mb-10"
                  /* 16:9 across two thirds of a wide sheet is most of a
                     screen of photograph before a word has been read. */
                  frame="max-h-[min(58vh,540px)]"
                />
              )}

              {/* The publisher's own syndicated text where they provide it. */}
              <article className="max-w-[68ch]">
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
                    className="kicker text-micro text-faint transition-colors hover:text-accent"
                  >
                    Original ↗
                  </a>
                  {desk && (
                    <Link
                      href={`/${desk.slug}`}
                      className="kicker text-micro text-muted transition-colors hover:text-accent ml-auto"
                    >
                      ← Back to {desk.label}
                    </Link>
                  )}
                </div>
              </article>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-20">
              <BandHead
                weight="major"
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
