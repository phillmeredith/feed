import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { PageHead } from "@/components/PageHead";
import { DeskArchive } from "@/components/DeskArchive";
import { categories, categoryBySlug, groupBySlug } from "@/lib/categories";
import { getFeed } from "@/lib/feed";
import { withArchive, deskSplit, listing } from "@/lib/archive";

/*
 * The morgue of a desk, on the same ten-minute window as the desk itself —
 * what has fallen past the last page only changes when something new arrives.
 */
export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams() {
  return categories.map((c) => ({ desk: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[desk]/archive">): Promise<Metadata> {
  const { desk } = await params;
  const category = categoryBySlug(desk);
  if (!category) return {};
  return {
    title: `${category.label} archive — The Dispatch`,
    description: `Everything ${category.label} has filed, back to the first issue.`,
  };
}

export default async function DeskArchivePage({
  params,
}: PageProps<"/[desk]/archive">) {
  const { desk } = await params;
  const category = categoryBySlug(desk);
  if (!category) notFound();

  const { articles } = await getFeed();
  const { live, overflow } = deskSplit(withArchive(articles, category.slug));
  const group = category.group ? groupBySlug(category.group) : undefined;

  return (
    <>
      <Masthead />

      <main className="sheet flex-1 w-full pb-24 pt-7">
        <PageHead
          section={group ? { label: group.label, href: `/${group.slug}` } : undefined}
          subnav={
            category.group
              ? { group: category.group, current: category.slug }
              : undefined
          }
          title={`${category.label} archive`}
          standfirst="Everything this desk has published and is no longer showing you — the stories that have fallen past its last page, and the ones you have marked read."
          meta="Feeds carry a fortnight; this goes back to the first issue"
          tabs={{ desk: category.slug, current: "archive" }}
        />

        {/*
          * Both halves cross to the browser — the filed stories to be listed,
          * and what is still on the desk so that anything the reader has
          * marked read can join them without a round trip. Trimmed to what a
          * line of a list prints.
          */}
        <DeskArchive
          filed={overflow.map(listing)}
          live={live.map(listing)}
          deskHref={`/${category.slug}`}
        />
      </main>

      <Footer />
    </>
  );
}
