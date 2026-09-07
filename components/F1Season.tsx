import Link from "next/link";
import {
  season,
  driverStandings,
  constructorStandings,
  races,
  nextRace,
  driverName,
} from "@/lib/f1";
import { highlightsFor, f1Key } from "@/lib/highlights";
import { HighlightReel } from "./HighlightReel";
import { SpoilerGuard, SpoilerToggle } from "./SpoilerGuard";
import { LastUpdated } from "./EventStatus";
import { sportDate, sportTime } from "@/lib/format";

function raceDate(date: string) {
  // Rendered in London time, not the server's — see lib/format.
  return sportDate(date, { day: "numeric", month: "short" });
}

const PODIUM = ["1st", "2nd", "3rd"];

/**
 * The season, led by the last race.
 *
 * A season page that opens on a points table answers a question nobody asked
 * first. What you want on a Monday is what happened on Sunday — who won, by
 * how much, and the highlights — with the table underneath it and every other
 * round available without leaving.
 */
export function F1Season() {
  const s = season();
  const drivers = driverStandings();
  const teams = constructorStandings();
  const calendar = races();
  const next = nextRace();
  const run = calendar.filter((r) => r.results?.length);
  const latest = run[run.length - 1];

  const leader = drivers[0];
  const second = drivers[1];
  const gap = leader && second ? leader.points - second.points : 0;

  /*
   * Season order, as a reader wants it rather than as the calendar prints it.
   *
   * Straight reverse order buried the season under eleven rounds that hadn't
   * happened yet — you scrolled past most of a year of blanks to reach the
   * last result. So: what just happened, then what's next, then back through
   * the season, with the rounds still to come at the foot where they belong.
   */
  const ordered = latest
    ? [
        latest,
        ...(next ? [next] : []),
        ...run.filter((r) => r.round !== latest.round).reverse(),
        ...calendar.filter(
          (r) => !r.results?.length && r.round !== next?.round
        ),
      ]
    : calendar;

  return (
    <div className="mt-12 flex flex-col gap-20">
      {next && (
        <section>
          <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-[11px] text-accent">
              Next · round {next.round} · {next.name}
            </h2>
            <p className="kicker text-[9px] text-faint">
              {next.locality}, {next.country}
            </p>
          </div>

          {next.sessions && next.sessions.length > 0 ? (
            /*
             * The whole weekend, not just Sunday. Every session already came
             * back from the API with a UTC instant attached and none of it
             * was being kept, so the page could not answer "when is qualifying".
             */
            /*
             * A weekend reads across, not down. As a full-width list each
             * session put its name at the left margin and its time a thousand
             * pixels away at the right, with nothing in between — the two
             * things you need to read together were the furthest apart on the
             * page. Five columns puts the time under its own session and uses
             * the width for content instead of air.
             */
            <ol className="mt-8 grid gap-x-8 gap-y-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {next.sessions.map((session) => (
                <li key={session.name} className="border-t border-rule pt-4">
                  <p className="kicker text-[9px] text-faint">
                    {sportDate(session.at, { weekday: "long" })}
                  </p>
                  <p className="font-body font-semibold text-[16px] mt-2">
                    {session.name}
                  </p>
                  <p className="display text-2xl mt-2 tabular-nums">
                    {sportTime(session.at)}
                  </p>
                  <p className="kicker text-[9px] text-faint mt-1">
                    {sportDate(session.at, { day: "numeric", month: "short" })}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-serif italic text-muted mt-5">
              Session times for this round haven&apos;t been published yet.
            </p>
          )}
        </section>
      )}

      {latest && (
        <section>
          <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-[11px] text-accent">
              Last · round {latest.round} · {latest.name}
            </h2>
            <SpoilerToggle />
          </div>

          <p className="kicker text-[9px] text-faint mt-5">
            {raceDate(latest.date)} · {latest.locality}, {latest.country}
          </p>

          <div className="mt-6">
            <SpoilerGuard label="Result and highlights">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
            <div>
              <ol>
                {(latest.results ?? []).slice(0, 3).map((r, i) => (
                  <li
                    key={r.position}
                    className="border-t border-rule py-4 flex items-baseline gap-4"
                  >
                    <span className="kicker text-[10px] text-accent w-8 shrink-0">
                      {PODIUM[i]}
                    </span>
                    <span className="min-w-0">
                      <span className="display text-xl block">{r.driver}</span>
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

              <RaceResults race={latest} />
            </div>

            {highlightsFor(f1Key(s.season, latest.round)).length > 0 ? (
              <HighlightReel
                highlights={highlightsFor(f1Key(s.season, latest.round))}
              />
            ) : (
              <p className="font-serif italic text-muted">
                Formula 1 hasn&apos;t posted highlights for this round yet.
              </p>
            )}
              </div>
            </SpoilerGuard>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap border-b border-rule pb-3">
          <h2 className="kicker text-[11px] text-accent">
            Every round of {s.season}
          </h2>
          <p className="kicker text-[9px] text-faint">
            {run.length} of {calendar.length} run
            {leader && (
              <>
                <span className="mx-2 text-rule">/</span>
                {driverName(leader)} leads by {gap}
              </>
            )}
          </p>
        </div>

        {/*
          * Twenty-three rounds down a single 1336px column left every row
          * mostly empty and the section three thousand pixels tall. Two
          * columns halve the height and give each row a width its content
          * can actually fill.
          */}
        <div className="mt-2 grid gap-x-16 lg:grid-cols-2">
          {ordered.map((race) => {
            const done = Boolean(race.results?.length);
            const isNext = next?.round === race.round;
            const reels = highlightsFor(f1Key(s.season, race.round));

            return (
              <div key={race.round} className="border-t border-rule py-5">
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <span className="kicker text-[9px] text-faint w-14 shrink-0 tabular-nums">
                    R{race.round}
                  </span>
                  <span
                    className={`font-body font-semibold text-[16px] ${done ? "" : "text-muted"}`}
                  >
                    {race.name}
                  </span>
                  <span className="kicker text-[9px] text-faint">
                    {raceDate(race.date)}
                    {isNext && <span className="ml-3 text-accent">next up</span>}
                  </span>
                  {race.winner && (
                    <span className="ml-auto">
                      <SpoilerGuard label="Winner">
                        <span className="text-[14px] text-accent">
                          {race.winner}
                        </span>
                      </SpoilerGuard>
                    </span>
                  )}
                </div>

                {done ? (
                  <div className="mt-3 pl-0 sm:pl-[4.75rem]">
                    <SpoilerGuard label="Podium">
                      <p className="text-[14px] text-muted">
                        {(race.results ?? [])
                          .slice(0, 3)
                          .map((r, i) => `${i + 1}. ${r.driver}`)
                          .join("   ")}
                      </p>
                    </SpoilerGuard>
                    <RaceResults race={race} />
                    {reels.length > 0 && (
                      <details className="group mt-3">
                        <summary className="kicker text-[9px] text-muted hover:text-accent cursor-pointer list-none">
                          <span className="group-open:hidden">
                            Watch the highlights →
                          </span>
                          <span className="hidden group-open:inline">
                            Hide highlights ↑
                          </span>
                        </summary>
                        <div className="mt-5">
                          <HighlightReel highlights={reels} />
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 pl-0 sm:pl-[4.75rem] text-[13px] text-faint">
                    {race.locality}, {race.country}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* A points table after the flag says who won as surely as the podium does. */}
      <SpoilerGuard label="Championship standings">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* `min-w-0`: the table below sets a min-width and scrolls inside its
            own wrapper, but a grid item defaults to a min-content floor, so
            without this the 420px table widened the page instead. */}
        <section className="min-w-0">
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Drivers
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-[14px]">
              <thead>
                <tr className="border-b border-rule">
                  <th className="kicker text-[9px] text-faint text-left pb-3 pr-3">#</th>
                  <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Driver</th>
                  <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Team</th>
                  <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">Wins</th>
                  <th className="kicker text-[9px] text-faint text-right pb-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.driverId} className="border-b border-rule group">
                    <td className="py-2.5 pr-3 text-faint tabular-nums">
                      {d.position}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/f1/${d.driverId}`}
                        className="font-body font-semibold group-hover:text-accent transition-colors"
                      >
                        {driverName(d)}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-muted text-[13px]">
                      {d.constructor}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                      {d.wins || "—"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-accent font-semibold">
                      {d.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Constructors
          </h2>
          <table className="mt-4 w-full text-[14px]">
            <tbody>
              {teams.map((t) => (
                <tr key={t.constructorId} className="border-b border-rule">
                  <td className="py-2.5 pr-3 text-faint tabular-nums w-6">
                    {t.position}
                  </td>
                  <td className="py-2.5 pr-4 font-body font-semibold">
                    {t.name}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-accent font-semibold">
                    {t.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      </SpoilerGuard>

      <LastUpdated
        at={s.updated ?? null}
        source="Standings, calendar and results from the Jolpica F1 API; highlights are Formula 1's own"
      />
    </div>
  );
}

/** The full classification, folded away until asked for. */
function RaceResults({
  race,
}: {
  race: { results?: { position: number; driver: string; constructor: string; time?: string }[] };
}) {
  const results = race.results ?? [];
  if (results.length <= 3) return null;

  return (
    <details className="group mt-3">
      <summary className="kicker text-[9px] text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          Full result, {results.length} classified →
        </span>
        <span className="hidden group-open:inline">Hide full result ↑</span>
      </summary>
      <table className="mt-4 w-full text-[14px]">
        <tbody>
          {results.map((r) => (
            <tr key={r.position} className="border-b border-rule">
              <td className="py-2 pr-4 text-faint tabular-nums w-8">
                {r.position}
              </td>
              <td className="py-2 pr-4 font-body font-semibold">{r.driver}</td>
              <td className="py-2 pr-4 text-muted text-[13px]">
                {r.constructor}
              </td>
              <td className="py-2 text-right tabular-nums text-muted text-[13px]">
                {r.time ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
