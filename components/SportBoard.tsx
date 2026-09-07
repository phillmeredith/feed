import Link from "next/link";
import { StateBadge } from "./ui/StateBadge";
import { stateFor } from "./EventStatus";
import { sportDate, sportTime } from "@/lib/format";
import { races, nextRace, driverStandings, driverName } from "@/lib/f1";
import { nextEvent as nextGolf, latestEvent as lastGolf } from "@/lib/golf";
import { nextEvent as nextUfc, completedEvents as ufcDone } from "@/lib/ufc";

/**
 * What is on, and what just happened, across all three sports.
 *
 * The section front used to be a lead story and three lists of headlines,
 * which is a news page with the word Sport at the top. It led on a wedge
 * review, and to find out whether there was a race this weekend you had to
 * scroll past two and a half thousand pixels of reporting and then click into
 * a desk.
 *
 * A sport front's first screen has one job: what's on, when, and what
 * happened last time. That is three facts per sport and they are all in the
 * stores already. The reading goes underneath, where reading belongs.
 */
interface Fixture {
  sport: string;
  href: string;
  next: { name: string; at: string; detail?: string; href?: string } | null;
  last: { name: string; result: string; href?: string } | null;
  standing?: string;
}

function fixtures(): Fixture[] {
  const board: Fixture[] = [];

  // --- Formula One ---
  const upcoming = nextRace();
  const run = races().filter((r) => r.results?.length);
  const lastRace = run[run.length - 1];
  const leader = driverStandings()[0];

  board.push({
    sport: "Formula One",
    href: "/f1",
    next: upcoming
      ? {
          name: upcoming.name,
          // The race itself, not the first practice — that is what "on" means.
          at:
            upcoming.sessions?.find((s) => s.name === "Race")?.at ??
            `${upcoming.date}T${upcoming.time ?? "00:00:00Z"}`,
          detail: `${upcoming.locality}, ${upcoming.country}`,
          href: `/f1/race/${upcoming.round}`,
        }
      : null,
    last: lastRace?.winner
      ? {
          name: lastRace.name,
          result: `${lastRace.winner} won`,
          href: `/f1/race/${lastRace.round}`,
        }
      : null,
    standing: leader
      ? `${driverName(leader)} leads on ${leader.points}`
      : undefined,
  });

  // --- Golf ---
  const golfNext = nextGolf();
  const golfLast = lastGolf();

  board.push({
    sport: "Golf",
    href: "/golf",
    next: golfNext
      ? {
          name: golfNext.name,
          at: `${golfNext.startDate}T07:00:00Z`,
          detail: golfNext.major ? "Major" : golfNext.venue,
          href: `/golf/event/${golfNext.id}`,
        }
      : null,
    last: golfLast?.winner
      ? {
          name: golfLast.name,
          result: `${golfLast.winner} won`,
          href: `/golf/event/${golfLast.id}`,
        }
      : null,
  });

  // --- The UFC ---
  // A Contender Series card is not the answer to what's on next.
  const ufcNext = nextUfc(new Date(), false);
  const ufcLast = ufcDone()[0];
  const headline = ufcLast?.fights[ufcLast.fights.length - 1];

  board.push({
    sport: "The UFC",
    href: "/ufc",
    next: ufcNext
      ? {
          name: ufcNext.name,
          at: ufcNext.date,
          detail:
            ufcNext.fights.length > 0
              ? `${ufcNext.fights.length} bouts`
              : "Card not announced",
          href: `/ufc/card/${ufcNext.id}`,
        }
      : null,
    last: headline?.winner
      ? {
          name: ufcLast.name,
          result: `${headline.winner} won`,
          href: `/ufc/card/${ufcLast.id}`,
        }
      : null,
  });

  return board;
}

export function SportBoard() {
  const board = fixtures();

  return (
    <section aria-labelledby="sport-board">
      <h2 id="sport-board" className="sr-only">
        Fixtures and results
      </h2>

      <div className="grid gap-x-12 gap-y-14 md:grid-cols-3">
        {board.map((entry) => (
          <div key={entry.sport}>
            <h3 className="display text-subhead">
              <Link
                href={entry.href}
                className="hover:text-accent transition-colors"
              >
                {entry.sport}
              </Link>
            </h3>

            {entry.next ? (
              <div className="mt-6">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="kicker text-micro text-faint">Next</p>
                  <StateBadge
                    state={stateFor({
                      startsAt: entry.next.at,
                      finished: false,
                    })}
                  />
                </div>
                <p className="font-body font-semibold text-body leading-snug mt-2">
                  {entry.next.href ? (
                    <Link
                      href={entry.next.href}
                      className="hover:text-accent transition-colors"
                    >
                      {entry.next.name}
                    </Link>
                  ) : (
                    entry.next.name
                  )}
                </p>
                <p className="figures text-small text-accent mt-1">
                  {sportDate(entry.next.at, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  <span className="mx-2 text-rule">/</span>
                  {sportTime(entry.next.at)}
                </p>
                {entry.next.detail && (
                  <p className="kicker text-micro text-faint mt-1">
                    {entry.next.detail}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-serif italic text-muted mt-6">
                Nothing scheduled.
              </p>
            )}

            {entry.last && (
              <div className="mt-6">
                <p className="kicker text-micro text-faint">Last</p>
                <p className="font-body text-small leading-snug mt-2 text-muted">
                  {entry.last.href ? (
                    <Link
                      href={entry.last.href}
                      className="hover:text-accent transition-colors"
                    >
                      {entry.last.name}
                    </Link>
                  ) : (
                    entry.last.name
                  )}
                </p>
                <div className="mt-2">
                  <p className="font-body text-small text-paper">
                    {entry.last.result}
                  </p>
                </div>
              </div>
            )}

            {entry.standing && (
              <div className="mt-4">
                <p className="kicker text-micro text-faint">
                  {entry.standing}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
