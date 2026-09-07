import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { SubNav } from "@/components/SubNav";
import { SpoilerGuard, SpoilerToggle } from "@/components/SpoilerGuard";
import { HighlightReel } from "@/components/HighlightReel";
import { ListCard } from "@/components/cards";
import { LastUpdated } from "@/components/EventStatus";
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
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-10 py-10 flex-1 w-full">
        <header className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/f1" className="hover:underline">
              Formula One
            </Link>
            <span className="mx-2 text-rule">/</span>
            Round {race.round} of {races().length}
          </p>

          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            {race.name}
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4">
            {race.circuitName} · {race.locality}, {race.country}
          </p>

          <SubNav group="sport" current="f1" />
        </header>

        <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <section>
              <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
                <h2 className="kicker text-[11px] text-accent">
                  {done ? "How it finished" : "When it runs"}
                </h2>
                {done && <SpoilerToggle />}
              </div>

              {!done && race.sessions && race.sessions.length > 0 && (
                <ol className="mt-8 grid gap-x-8 gap-y-8 grid-cols-2 lg:grid-cols-3">
                  {race.sessions.map((sessionEntry) => (
                    <li
                      key={sessionEntry.name}
                      className="border-t border-rule pt-4"
                    >
                      <p className="kicker text-[9px] text-faint">
                        {sportDate(sessionEntry.at, { weekday: "long" })}
                      </p>
                      <p className="font-body font-semibold text-[16px] mt-2">
                        {sessionEntry.name}
                      </p>
                      <p className="display text-2xl mt-2 tabular-nums">
                        {sportTime(sessionEntry.at)}
                      </p>
                      <p className="kicker text-[9px] text-faint mt-1">
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
                  <SpoilerGuard label="Classification">
                    <ol>
                      {(race.results ?? []).slice(0, 3).map((r, i) => (
                        <li
                          key={r.position}
                          className="border-t border-rule py-4 flex items-baseline gap-4"
                        >
                          <span className="kicker text-[10px] text-accent w-8 shrink-0">
                            {PODIUM[i]}
                          </span>
                          <span className="min-w-0">
                            <span className="display text-2xl block">
                              {r.driver}
                            </span>
                            <span className="text-[13px] text-muted">
                              {r.constructor}
                              {r.time && (
                                <>
                                  <span className="mx-2 text-rule">/</span>
                                  <span className="tabular-nums">{r.time}</span>
                                </>
                              )}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>

                    <table className="mt-10 w-full text-[14px]">
                      <caption className="sr-only">
                        Full classification, {(race.results ?? []).length}{" "}
                        drivers
                      </caption>
                      <thead>
                        <tr className="border-b border-rule">
                          <th scope="col" className="kicker text-[9px] text-faint text-left pb-3 w-10">
                            #
                          </th>
                          <th scope="col" className="kicker text-[9px] text-faint text-left pb-3">
                            Driver
                          </th>
                          <th scope="col" className="kicker text-[9px] text-faint text-left pb-3">
                            Team
                          </th>
                          <th scope="col" className="kicker text-[9px] text-faint text-right pb-3">
                            Time / status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(race.results ?? []).map((r) => (
                          <tr key={r.position} className="border-b border-rule">
                            <td className="py-2.5 text-faint tabular-nums">
                              {r.position}
                            </td>
                            <td className="py-2.5 pr-4 font-body font-semibold">
                              {r.driver}
                            </td>
                            <td className="py-2.5 pr-4 text-muted text-[13px]">
                              {r.constructor}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-muted text-[13px]">
                              {r.time ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SpoilerGuard>
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
                <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
                  Every session on video
                </h2>
                <div className="mt-6">
                  <SpoilerGuard label="Highlights">
                    <HighlightReel highlights={reels} />
                  </SpoilerGuard>
                </div>
              </section>
            )}

            {coverage.length > 0 && (
              <section className="mt-20">
                <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
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
            <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
              {done ? "How the weekend ran" : "The circuit"}
            </h2>
            {done && race.sessions && race.sessions.length > 0 ? (
              <ol className="mt-2 divide-y divide-[var(--rule)]">
                {race.sessions.map((sessionEntry) => (
                  <li key={sessionEntry.name} className="py-3">
                    <p className="font-body font-semibold text-[15px]">
                      {sessionEntry.name}
                    </p>
                    <p className="kicker text-[9px] text-faint mt-1">
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
                <p className="font-body text-[15px]">{race.circuitName}</p>
                <p className="kicker text-[9px] text-faint mt-2">
                  {race.locality}, {race.country}
                </p>
              </div>
            )}

            {leader && (
              <div className="mt-12">
                <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
                  Championship
                </h2>
                <div className="mt-4">
                  <SpoilerGuard label="Championship leader">
                    <p className="font-serif text-lg text-muted">
                      <span className="text-paper">
                        {leader.givenName} {leader.familyName}
                      </span>{" "}
                      leads on {leader.points} points after{" "}
                      {races().filter((r) => r.results?.length).length} rounds.
                    </p>
                  </SpoilerGuard>
                </div>
              </div>
            )}

            <nav className="mt-12 border-t border-rule pt-6 flex items-center justify-between kicker text-[10px]">
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
