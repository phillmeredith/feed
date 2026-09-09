import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { SubNav } from "@/components/SubNav";
import { HighlightReel } from "@/components/HighlightReel";
import { ListCard } from "@/components/cards";
import { LastUpdated } from "@/components/EventStatus";
import { DataTable } from "@/components/ui/DataTable";
import { season, races, driverStandings } from "@/lib/f1";
import { highlightsFor, f1Key } from "@/lib/highlights";
import { withArchive } from "@/lib/archive";
import { getFeed } from "@/lib/feed";
import { sportDate, sportTime } from "@/lib/format";
import { racePageArticles } from "@/lib/race";

export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams() {
  return races().map((race) => ({ round: String(race.round) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/f1/race/[round]">): Promise<Metadata> {
  const { round } = await params;
  const race = races().find((r) => String(r.round) === round);
  if (!race) return { title: "Round not found — The Dispatch" };
  return {
    title: `${race.name} — The Dispatch`,
    description: `Round ${race.round} of the ${season().season} season at ${race.circuitName}: session times, classification and highlights.`,
  };
}

const PODIUM = ["1st", "2nd", "3rd"];

export default async function RacePage({
  params,
}: PageProps<"/f1/race/[round]">) {
  const { round } = await params;
  const race = races().find((r) => String(r.round) === round);
  if (!race) notFound();

  const s = season();
  const done = Boolean(race.results?.length);
  const reels = highlightsFor(f1Key(s.season, race.round));
  const leader = driverStandings()[0];

  const { articles } = await getFeed();
  const coverage = racePageArticles(withArchive(articles, "f1"), race);

  const previous = races().find((r) => r.round === race.round - 1);
  const next = races().find((r) => r.round === race.round + 1);

  return (
    <>
      <Masthead />

      <main className="sheet py-10 flex-1 w-full">
        <header className="border-b border-rule pb-8">
          <p className="display text-2xl sm:text-3xl text-muted">
            <Link href="/sport" className="hover:text-accent transition-colors">
              Sport
            </Link>
          </p>

          <SubNav group="sport" current="f1" />

          <p className="kicker text-micro text-accent mt-10">
            <Link href="/f1" className="hover:underline">
              Formula One
            </Link>
            <span className="mx-2 text-rule">/</span>
            Round {race.round} of {races().length}
          </p>

          <h1 className="display text-title mt-4">
            {race.name}
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4">
            {race.circuitName} · {race.locality}, {race.country}
          </p>
        </header>

        <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <section>
              <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
                <h2 className="kicker text-label text-accent">
                  {done ? "How it finished" : "When it runs"}
                </h2>
              </div>

              {!done && race.sessions && race.sessions.length > 0 && (
                <ol className="mt-8 grid gap-x-8 gap-y-8 grid-cols-2 lg:grid-cols-3">
                  {race.sessions.map((sessionEntry) => (
                    <li
                      key={sessionEntry.name}
                      className=""
                    >
                      <p className="kicker text-micro text-faint">
                        {sportDate(sessionEntry.at, { weekday: "long" })}
                      </p>
                      <p className="font-body font-semibold text-body mt-2">
                        {sessionEntry.name}
                      </p>
                      <p className="display text-2xl mt-2 figures">
                        {sportTime(sessionEntry.at)}
                      </p>
                      <p className="kicker text-micro text-faint mt-1">
                        {sportDate(sessionEntry.at, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              {done ? (
                <div className="mt-6">
                  <ol>
                    {(race.results ?? []).slice(0, 3).map((r, i) => (
                      <li
                        key={r.position}
                        className="py-3 flex items-baseline gap-4"
                      >
                        <span className="kicker text-micro text-accent w-8 shrink-0">
                          {PODIUM[i]}
                        </span>
                        <span className="min-w-0">
                          <span className="display text-2xl block">
                            {r.driver}
                          </span>
                          <span className="text-fine text-muted">
                            {r.constructor}
                            {r.time && (
                              <>
                                <span className="mx-2 text-rule">/</span>
                                <span className="figures">{r.time}</span>
                              </>
                            )}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-10" data-density="reference">
                    <DataTable
                      caption={`Full classification, ${(race.results ?? []).length} drivers`}
                      rows={race.results ?? []}
                      rowKey={(r) => String(r.position)}
                      columns={[
                        {
                          key: "pos",
                          header: "#",
                          numeric: true,
                          width: "3rem",
                          cell: (r) => (
                            <span className="text-faint">{r.position}</span>
                          ),
                        },
                        {
                          key: "driver",
                          header: "Driver",
                          cell: (r) => (
                            <span className="font-body font-semibold">
                              {r.driver}
                            </span>
                          ),
                        },
                        {
                          key: "team",
                          header: "Team",
                          cell: (r) => (
                            <span className="text-muted text-fine">
                              {r.constructor}
                            </span>
                          ),
                        },
                        {
                          key: "time",
                          header: "Time / status",
                          align: "right",
                          numeric: true,
                          cell: (r) => (
                            <span className="text-muted text-fine">
                              {r.time ?? "—"}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <p className="font-serif text-lg text-muted mt-8">
                  Nothing has been run yet. The classification and the
                  highlights will appear here once it has.
                </p>
              )}
            </section>

            {reels.length > 0 && (
              <section className="mt-20">
                <h2 className="panel-title">
                  Every session on video
                </h2>
                <div className="mt-6">
                  <HighlightReel highlights={reels} />
                </div>
              </section>
            )}

            {coverage.length > 0 && (
              <section className="mt-20">
                <h2 className="panel-title">
                  Written about this round
                </h2>
                <div className="mt-8 grid gap-x-12 gap-y-4 sm:grid-cols-2">
                  {coverage.map((a) => (
                    <ListCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:border-l lg:border-rule lg:pl-12">
            <h2 className="panel-subtitle">
              {done ? "How the weekend ran" : "The circuit"}
            </h2>
            {done && race.sessions && race.sessions.length > 0 ? (
              <ol className="mt-2 divide-y divide-[var(--rule)]">
                {race.sessions.map((sessionEntry) => (
                  <li key={sessionEntry.name} className="py-3">
                    <p className="font-body font-semibold text-small">
                      {sessionEntry.name}
                    </p>
                    <p className="kicker text-micro text-faint mt-1">
                      {sportDate(sessionEntry.at, {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                      <span className="mx-2 text-rule">/</span>
                      {sportTime(sessionEntry.at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-4">
                <p className="font-body text-small">{race.circuitName}</p>
                <p className="kicker text-micro text-faint mt-2">
                  {race.locality}, {race.country}
                </p>
              </div>
            )}

            {leader && (
              <div className="mt-12">
                <h2 className="panel-subtitle">
                  Championship
                </h2>
                <div className="mt-4">
                  <p className="font-serif text-lg text-muted">
                    <span className="text-ink">
                      {leader.givenName} {leader.familyName}
                    </span>{" "}
                    leads on {leader.points} points after{" "}
                    {races().filter((r) => r.results?.length).length} rounds.
                  </p>
                </div>
              </div>
            )}

            <nav className="mt-12 border-t border-rule pt-6 flex items-center justify-between kicker text-micro">
              {previous ? (
                <Link
                  href={`/f1/race/${previous.round}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  ← Round {previous.round}
                </Link>
              ) : (
                <span className="text-faint">← Round</span>
              )}
              {next ? (
                <Link
                  href={`/f1/race/${next.round}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  Round {next.round} →
                </Link>
              ) : (
                <span className="text-faint">Round →</span>
              )}
            </nav>

            <div className="mt-10">
              <LastUpdated
                at={s.updated ?? null}
                source="Jolpica F1 API; highlights from Formula 1"
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
