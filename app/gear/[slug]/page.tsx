import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { Timeline } from "@/components/Timeline";
import { PriceHistory } from "@/components/PriceHistory";
import { VideoPanel } from "@/components/VideoPanel";
import {
  allGear,
  gearBySlug,
  gearSlug,
  specsFor,
  coverageFor,
  relatedGear,
} from "@/lib/gearspec";
import { allArchived } from "@/lib/archive";
import { history } from "@/lib/series";
import { videosFor } from "@/lib/video";

export const revalidate = 3600;

/*
 * The directory runs to hundreds of products. The recent slice is prerendered
 * and the tail renders on first request, which keeps the build quick — and,
 * like every entity page here, none of it fetches: it reads the stores.
 */
export function generateStaticParams() {
  return allGear()
    .slice(0, 60)
    .map((item) => ({ slug: gearSlug(item.name) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/gear/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = gearBySlug(slug);
  if (!item) return { title: "Not in the directory — The Dispatch" };
  return {
    title: `${item.name} — The Dispatch`,
    description: `${item.brand} ${item.kind === "lens" ? "lens" : "camera"}, announced ${new Date(item.announcedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
  };
}

export default async function GearPage({ params }: PageProps<"/gear/[slug]">) {
  const { slug } = await params;
  const item = gearBySlug(slug);
  if (!item) notFound();

  const specs = specsFor(item);
  const coverage = coverageFor(item, allArchived());
  const related = relatedGear(item);
  const priceHistory = history("gear-pricing", slug, "price.new");
  const videos = videosFor(item);

  const announced = new Date(item.announcedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/gear" className="hover:underline">Gear directory</Link>
            <span className="mx-2 text-rule">/</span>
            {item.brand}
          </p>
          <h1 className="display text-[clamp(2rem,5vw,3.6rem)] mt-4">
            {item.name}
          </h1>
          <p className="font-serif italic text-lg text-muted mt-3">
            Announced {announced}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Specification
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="border-t border-rule pt-3">
                <dt className="kicker text-[9px] text-faint">{spec.label}</dt>
                <dd className="font-body font-semibold text-[17px] mt-1.5">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-[13px] text-faint mt-6 max-w-2xl">
            Derived from the manufacturer&apos;s own designation and the
            directory record. A lens name states its focal length, maximum
            aperture, motor, stabilisation and sealing — nothing here is
            inferred beyond what the name says.
          </p>
        </section>

        <PriceHistory
          input={priceHistory}
          output={[]}
          since={priceHistory[0]?.at}
        />

        <Timeline articles={coverage} announcedAt={item.announcedAt} />

        {videos.length > 0 && (
          <div className="mt-16">
            <VideoPanel
              videos={videos}
              standfirst={`Reviews of the ${item.name} from the channels this desk trusts, playable here.`}
            />
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-rule pt-8">
            <h2 className="kicker text-[11px] text-accent">
              {item.kind === "lens" && item.mounts?.length
                ? "Other glass for this mount"
                : `More from ${item.brand}`}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {related.map((g) => (
                <Link
                  key={g.name}
                  href={`/gear/${gearSlug(g.name)}`}
                  className="kicker text-[10px] text-muted bg-surface border border-rule px-3 py-2 hover:text-accent hover:border-accent-dim transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
