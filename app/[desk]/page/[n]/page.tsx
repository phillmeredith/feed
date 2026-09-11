import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryBySlug } from "@/lib/categories";
import { DeskView } from "@/components/DeskView";

/*
 * The paged tail of a desk.
 *
 * Page one is the route above; everything older is here, as a path segment
 * rather than a query string, so both can be cached.
 *
 * `generateStaticParams` is what actually buys that, and this route went
 * without it for months. A dynamic route that does not declare it builds as
 * dynamic and never populates the route cache at all — `x-vercel-cache` was
 * MISS on every request to /cameras/page/2, and each one paid for forty feeds
 * and their extraction. Seven and a half seconds, per reader, per visit. The
 * story page had exactly this bug and exactly this fix; the comment above
 * claimed these pages were "kept for the same ten minutes as the desk itself"
 * and they never were.
 *
 * The list is empty on purpose, as it is there: which pages exist depends on
 * how much the desks have accumulated, so prerendering a slice at build time
 * would bake in whatever the count was that minute. What the declaration buys
 * is the caching — the first reader of page two renders it, everyone after
 * gets it from the cache until the window turns over.
 */
export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams(): { desk: string; n: string }[] {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/[desk]/page/[n]">): Promise<Metadata> {
  const { desk, n } = await params;
  const category = categoryBySlug(desk);
  if (!category) return {};
  return {
    title: `${category.label}, page ${n} — The Dispatch`,
    description: category.standfirst,
  };
}

export default async function DeskPaged({
  params,
}: PageProps<"/[desk]/page/[n]">) {
  const { desk, n } = await params;

  const page = Number(n);
  // Page one has its own URL; a second address for it would split the cache.
  if (!Number.isInteger(page) || page < 2) notFound();
  if (!categoryBySlug(desk)) notFound();

  return <DeskView desk={desk} page={page} />;
}
