import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryBySlug } from "@/lib/categories";
import { DeskView } from "@/components/DeskView";

/*
 * The paged tail of a desk.
 *
 * Page one is the route above; everything older is here, as a path segment
 * rather than a query string, so both can be cached. Nobody links to page
 * fourteen, so these render on first request and are kept for the same ten
 * minutes as the desk itself.
 */
export const revalidate = 600;
export const maxDuration = 60;

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
