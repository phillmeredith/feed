import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, categoryBySlug, groupBySlug, groups } from "@/lib/categories";
import { DeskView } from "@/components/DeskView";
import { GroupPage } from "@/components/GroupPage";

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

export function generateStaticParams() {
  return [
    ...groups.map((g) => ({ desk: g.slug })),
    ...categories.map((c) => ({ desk: c.slug })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/[desk]">): Promise<Metadata> {
  const { desk } = await params;
  const group = groupBySlug(desk);
  if (group) {
    return { title: `${group.label} — The Dispatch`, description: group.standfirst };
  }
  const category = categoryBySlug(desk);
  if (!category) return {};
  return {
    title: `${category.label} — The Dispatch`,
    description: category.standfirst,
  };
}

export default async function Desk({ params }: PageProps<"/[desk]">) {
  const { desk } = await params;

  // A group slug renders an overview of the desks beneath it.
  const group = groupBySlug(desk);
  if (group) return <GroupPage group={group} />;

  if (!categoryBySlug(desk)) notFound();
  return <DeskView desk={desk} page={1} />;
}
