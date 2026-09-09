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
import { DataTable } from "./ui/DataTable";
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
  const calendar = races();
  const next = nextRace();
  const run = calendar.filter((r) => r.results?.length);
  const latest = run[run.length - 1];

  return (
    <div className="mt-12 flex flex-col gap-20">
      {next ? (
        /*
         * The weekend, at the size a weekend deserves.
         *
         * This was a strip of five small cards under a kicker, which is the
         * treatment a footnote gets. It is the reason anyone opens this page
         * on a Thursday: which sessions, when, and how long until the next
         * one. The next session is marked, and the race is set larger than
         * the practices because it is not the same kind of thing.
         */
        <section>
          <p className="kicker text-micro text-faint">
            Round {next.round} of {calendar.length}
          </p>
          <h2 className="display text-title mt-3">
            <Link
              href={`/f1/race/${next.round}`}
              className="hover:text-accent transition-colors"
            >
              {next.name}
            </Link>
          </h2>
          <p className="font-serif text-lede text-muted mt-3">
            {next.circuitName} · {next.locality}, {next.country}
          </p>

          {next.sessions && next.sessions.length > 0 ? (
            <ol className="mt-band grid gap-x-8 gap-y-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {next.sessions.map((session) => {
                const isRace = session.name === "Race";
                return (
                  <li
                    key={session.name}
                    className={`border-t pt-4 ${
                      isRace ? "border-accent" : "border-rule"
                    }`}
                  >
                    <p className="kicker text-micro text-faint">
                      {sportDate(session.at, { weekday: "long" })}
                    </p>
                    <p
                      className={`font-body font-semibold mt-2 ${
                        isRace ? "text-body text-accent" : "text-small"
                      }`}
                    >
                      {session.name}
                    </p>
                    <p
                      className={`display figures mt-2 ${
                        isRace ? "text-headline" : "text-subhead"
                      }`}
                    >
                      {sportTime(session.at)}
                    </p>
                    <p className="kicker text-micro text-faint mt-1">
                      {sportDate(session.at, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="font-serif italic text-muted mt-6">
              Session times for this round haven&apos;t been published yet.
            </p>
          )}

          <p className="mt-step">
            <Link
              href={`/f1/race/${next.round}`}
              className="kicker text-micro text-muted hover:text-accent transition-colors"
            >
              Everything about this round →
            </Link>
          </p>
        </section>
      ) : (
        <p className="font-serif italic text-subhead text-muted">
          The season is over. The calendar has next year when it is published.
        </p>
      )}

      {latest && (
        <section>
          <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-label text-accent">
              Last · round {latest.round} · {latest.name}
            </h2>
          </div>

          <p className="kicker text-micro text-faint mt-5">
            {raceDate(latest.date)} · {latest.locality}, {latest.country}
          </p>

          <div className="mt-band">
            <div className="grid gap-x-16 gap-y-band lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            {/* A column with a label reads as a column; without one it was a
                list of names next to some videos, neither belonging to the
                other. */}
            <p className="panel-subtitle">The podium</p>
            <ol className="mt-near">
              {(latest.results ?? []).slice(0, 3).map((r, i) => (
                <li
                  key={r.position}
                  className="py-3 flex items-baseline gap-4"
                >
                  <span className="kicker text-micro text-accent w-8 shrink-0">
                    {PODIUM[i]}
                  </span>
                  <span className="min-w-0">
                    <span className="display text-xl block">{r.driver}</span>
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

            <RaceResults race={latest} />
          </div>

          <div>
            <p className="panel-subtitle">Highlights</p>
            <div className="mt-near">
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
          </div>
            </div>
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
          <h2 className="kicker text-label text-accent">
            Every round of {s.season}
          </h2>
          <p className="kicker text-micro text-faint">
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
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* `min-w-0`: the table below sets a min-width and scrolls inside its
          own wrapper, but a grid item defaults to a min-content floor, so
          without this the 420px table widened the page instead. */}
      <section className="min-w-0">
        <h2 className="panel-title">
          Drivers
        </h2>
        <div className="mt-4" data-density="reference">
          <DataTable
            caption="Drivers' championship"
            rows={drivers}
            rowKey={(d) => d.driverId}
            columns={[
              { key: "pos", header: "#", numeric: true, width: "3rem",
                cell: (d) => <span className="text-faint">{d.position}</span> },
              { key: "driver", header: "Driver",
                cell: (d) => (
                  <Link href={`/f1/driver/${d.driverId}`} className="hover:text-accent transition-colors">
                    <span className="font-body font-semibold">{driverName(d)}</span>
                  </Link>
                ) },
              { key: "team", header: "Team",
                cell: (d) => <span className="text-muted text-fine">{d.constructor}</span> },
              { key: "wins", header: "Wins", align: "right", numeric: true,
                cell: (d) => <span className="text-muted">{d.wins || "—"}</span> },
              { key: "points", header: "Points", align: "right", numeric: true,
                cell: (d) => <span className="text-accent font-semibold">{d.points}</span> },
            ]}
          />
        </div>
      </section>

      <section className="min-w-0">
        <h2 className="panel-title">
          Constructors
        </h2>
        <div className="mt-4" data-density="reference">
          <DataTable
            caption="Constructors' championship"
            rows={teams}
            rowKey={(t) => t.constructorId}
            columns={[
              { key: "pos", header: "#", numeric: true, width: "3rem",
                cell: (t) => <span className="text-faint">{t.position}</span> },
              { key: "team", header: "Constructor",
                cell: (t) => <span className="font-body font-semibold">{t.name}</span> },
              { key: "points", header: "Points", align: "right", numeric: true,
                cell: (t) => <span className="text-accent font-semibold">{t.points}</span> },
            ]}
          />
        </div>
      </section>
    </div>
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
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`display text-title leading-none figures ${
            done ? "text-ink" : "text-faint"
          }`}
        >
          {race.round}
        </span>
        {/* State in a word, and never by colour alone. */}
        <span className="kicker text-micro">
          {isNext ? (
            <span className="text-scheduled">Next up</span>
          ) : done ? (
            <span className="text-settled">Run</span>
          ) : (
            <span className="text-scheduled">To come</span>
          )}
        </span>
      </div>

      <h3
        className={`font-body font-semibold text-body leading-snug mt-3 ${
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
      <p className="kicker text-micro text-faint mt-2">
        {raceDate(race.date)}
        <span className="mx-2 text-rule">/</span>
        {race.locality}
      </p>

      <p className="mt-3">
        <Link
          href={`/f1/race/${race.round}`}
          className="kicker text-micro text-muted hover:text-accent transition-colors"
        >
          {done ? "View race" : "Race details"} →
        </Link>
      </p>

      {done && (
        <div className="mt-4">
          <ol className="text-small">
            {podium.map((r, i) => (
              <li key={r.position} className="flex items-baseline gap-3 py-1">
                <span className="kicker text-micro text-accent w-6 shrink-0">
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
      <summary className="kicker text-micro text-faint hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          All {results.length} classified →
        </span>
        <span className="hidden group-open:inline">Close ↑</span>
      </summary>
      <div className="mt-4" data-density="reference">
        <DataTable
          caption="Full classification"
          rows={results}
          rowKey={(r) => String(r.position)}
          columns={[
            { key: "pos", header: "#", numeric: true, width: "2.5rem",
              cell: (r) => <span className="text-faint">{r.position}</span> },
            { key: "driver", header: "Driver",
              cell: (r) => <span className="font-body font-semibold">{r.driver}</span> },
            { key: "team", header: "Team", hideBelow: "sm",
              cell: (r) => <span className="text-muted text-fine">{r.constructor}</span> },
            { key: "time", header: "Time", align: "right", numeric: true,
              cell: (r) => <span className="text-muted text-fine">{r.time ?? "—"}</span> },
          ]}
        />
      </div>
    </details>
  );
}
