import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { ListCard } from "@/components/cards";
import {
  driverStandings,
  driverById,
  driverName,
  resultsFor,
  season,
} from "@/lib/f1";
import { allArchived } from "@/lib/archive";

export const revalidate = 3600;

export function generateStaticParams() {
  return driverStandings().map((d) => ({ driver: d.driverId }));
}

export async function generateMetadata({
  params,
}: PageProps<"/f1/[driver]">): Promise<Metadata> {
  const { driver } = await params;
  const d = driverById(driver);
  if (!d) return { title: "Driver not found — The Dispatch" };
  return {
    title: `${driverName(d)} — The Dispatch`,
    description: `${d.constructor}. P${d.position} on ${d.points} points in the ${season().season} season.`,
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-t-2 border-accent-dim pt-3">
      <dt className="kicker text-[9px] text-faint">{label}</dt>
      <dd className="display text-[30px] mt-1.5 tabular-nums">{value}</dd>
    </div>
  );
}

export default async function DriverPage({ params }: PageProps<"/f1/[driver]">) {
  const { driver } = await params;
  const d = driverById(driver);
  if (!d) notFound();

  const name = driverName(d);
  const results = resultsFor(driver);
  const podiums = results.filter((r) => r.position <= 3).length;
  const best = results.length ? Math.min(...results.map((r) => r.position)) : null;

  // Coverage comes from the archive, never the live wire: entity pages don't fetch.
  const stories = allArchived()
    .filter((a) => `${a.headline} ${a.dek}`.includes(d.familyName))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 6);

  const teammates = driverStandings().filter(
    (x) => x.constructorId === d.constructorId && x.driverId !== d.driverId
  );

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/f1" className="hover:underline">The season</Link>
            <span className="mx-2 text-rule">/</span>
            {d.constructor}
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            {name}
          </h1>
          <p className="font-serif italic text-lg text-muted mt-3">
            {d.nationality}
            {d.code && ` · ${d.code}`}
          </p>
        </div>

        <dl className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
          <Stat label="Championship" value={`P${d.position}`} />
          <Stat label="Points" value={d.points} />
          <Stat label="Wins" value={d.wins} />
          <Stat label="Podiums" value={podiums} />
        </dl>

        {results.length > 0 && (
          <section className="mt-14">
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              This season · best finish P{best}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {results.map((r) => (
                <div
                  key={r.round}
                  className="border border-rule bg-surface px-3 py-2 min-w-[92px]"
                  title={r.race}
                >
                  <p className="kicker text-[9px] text-faint">R{r.round}</p>
                  <p
                    className={`display text-[19px] mt-1 tabular-nums ${
                      r.position <= 3 ? "text-accent" : ""
                    }`}
                  >
                    P{r.position}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5 truncate">
                    {r.country}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {teammates.length > 0 && (
          <section className="mt-14 border-t border-rule pt-6">
            <h2 className="kicker text-[11px] text-accent">
              Against the other side of the garage
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {teammates.map((t) => (
                <Link
                  key={t.driverId}
                  href={`/f1/${t.driverId}`}
                  className="group border border-rule bg-surface px-4 py-3 hover:border-accent-dim transition-colors"
                >
                  <span className="font-body font-semibold text-[15px] group-hover:text-accent transition-colors">
                    {driverName(t)}
                  </span>
                  <span className="kicker text-[9px] text-faint block mt-1">
                    P{t.position} · {t.points} points
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {stories.length > 0 && (
          <section className="mt-14">
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              On this desk
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((a) => (
                <ListCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
