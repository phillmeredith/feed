import Link from "next/link";
import {
  season,
  driverStandings,
  constructorStandings,
  races,
  nextRace,
  driverName,
  type Race,
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
export function F1Weekend() {
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

      <LastUpdated
        at={s.updated ?? null}
        source="Standings, calendar and results from the Jolpica F1 API; highlights are Formula 1's own"
      />
    </div>
  );
}

/** The season, round by round. Its own tab, because it is its own thing. */
export function F1Calendar() {
  const s = season();
  const calendar = races();
  const next = nextRace();
  const run = calendar.filter((r) => r.results?.length);
  const latest = run[run.length - 1];
  const leader = driverStandings()[0];
  const second = driverStandings()[1];
  const gap = leader && second ? leader.points - second.points : 0;

  const ordered = latest
    ? [
        latest,
        ...(next ? [next] : []),
        ...run.filter((r) => r.round !== latest.round).reverse(),
        ...calendar.filter((r) => !r.results?.length && r.round !== next?.round),
      ]
    : calendar;

  return (
    <div className="mt-12 flex flex-col gap-20">
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
          * A season reads as a grid of rounds, not a column of paragraphs.
          *
          * Each round used to carry four separate grey affordances — show the
          * winner, show the podium, the full result, the highlights — stacked
          * under a line of running text. Thirteen finished rounds made fifty
          * near-identical links and a section three thousand pixels tall, and
          * none of it was scannable.
          *
          * The round number does the work now: large, in the display face, so
          * the eye moves down the season by numeral rather than by reading. A
          * round has one way in, and everything that was behind four
          * disclosures is behind that one.
          */}
        <ol className="mt-6 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordered.map((race) => (
            <RoundCard
              key={race.round}
              race={race}
              season={s.season}
              isNext={next?.round === race.round}
            />
          ))}
        </ol>
      </section>

      <LastUpdated
        at={s.updated ?? null}
        source="Calendar and results from the Jolpica F1 API"
      />
    </div>
  );
}

/** Both championships. */
export function F1Standings() {
  const s = season();
  const drivers = driverStandings();
  const teams = constructorStandings();

  return (
    <div className="mt-12 flex flex-col gap-20">
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
                        href={`/f1/driver/${d.driverId}`}
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
        source="Standings from the Jolpica F1 API"
      />
    </div>
  );
}

/**
 * One round of the season.
 *
 * Everything a finished round has to say sits behind a single disclosure —
 * podium, full classification and highlights together — because three
 * separate ones said three times "there is something here" and never what.
 */
function RoundCard({
  race,
  season,
  isNext,
}: {
  race: Race;
  season: string;
  isNext: boolean;
}) {
  const done = Boolean(race.results?.length);
  const reels = highlightsFor(f1Key(season, race.round));
  const podium = (race.results ?? []).slice(0, 3);

  return (
    <li className="border-t border-rule pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`display text-[2.6rem] leading-none tabular-nums ${
            done ? "text-paper" : "text-faint"
          }`}
        >
          {race.round}
        </span>
        {/* State in a word, and never by colour alone. */}
        <span className="kicker text-[9px]">
          {isNext ? (
            <span className="text-accent">Next up</span>
          ) : done ? (
            <span className="text-faint">Run</span>
          ) : (
            <span className="text-faint">To come</span>
          )}
        </span>
      </div>

      <h3
        className={`font-body font-semibold text-[16px] leading-snug mt-3 ${
          done ? "" : "text-muted"
        }`}
      >
        <Link
          href={`/f1/race/${race.round}`}
          className="hover:text-accent transition-colors"
        >
          {race.name}
        </Link>
      </h3>
      <p className="kicker text-[9px] text-faint mt-2">
        {raceDate(race.date)}
        <span className="mx-2 text-rule">/</span>
        {race.locality}
      </p>

      <p className="mt-3">
        <Link
          href={`/f1/race/${race.round}`}
          className="kicker text-[9px] text-muted hover:text-accent transition-colors"
        >
          {done ? "View race" : "Race details"} →
        </Link>
      </p>

      {done && (
        <div className="mt-4">
          <SpoilerGuard label="Result">
            <ol className="text-[14px]">
              {podium.map((r, i) => (
                <li key={r.position} className="flex items-baseline gap-3 py-1">
                  <span className="kicker text-[9px] text-accent w-6 shrink-0">
                    {PODIUM[i]}
                  </span>
                  <span className="min-w-0 truncate">{r.driver}</span>
                </li>
              ))}
            </ol>

            <RaceResults race={race} />

            {/* The thumbnail is part of the round, so it stays on the page and
                takes the same blur as the names beside it. */}
            {reels.length > 0 && (
              <div className="mt-5">
                <HighlightReel highlights={reels.slice(0, 1)} />
              </div>
            )}
          </SpoilerGuard>
        </div>
      )}
    </li>
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
      <summary className="kicker text-[9px] text-faint hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          All {results.length} classified →
        </span>
        <span className="hidden group-open:inline">Close ↑</span>
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
