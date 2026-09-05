import { latestEvent, majors, playedEvents, golfSeason } from "@/lib/golf";
import type { GolfEvent } from "@/lib/golf";
import { highlightsFor, golfKey } from "@/lib/highlights";
import { HighlightReel } from "./HighlightReel";

function eventDates(event: GolfEvent) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const sameMonth = start.getMonth() === end.getMonth();
  return `${start.toLocaleDateString("en-GB", { day: "numeric", ...(sameMonth ? {} : { month: "short" }) })}–${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

/** Golf writes a score relative to par, and "E" rather than zero. */
function toPar(score: string) {
  if (!score || score === "0" || score === "E") return "E";
  return score.startsWith("-") || score.startsWith("+") ? score : `+${score}`;
}

const PLACE = ["1st", "2nd", "3rd"];

/**
 * The season, led by the last major.
 *
 * The majors are what a golf year is remembered by, so the page opens on the
 * most recent one rather than on whatever happened to be played last week.
 * Everything else is below it, in order, with its leaderboard folded away.
 */
export function GolfSeason() {
  const store = golfSeason();
  const lead = latestEvent();
  const bigFour = majors();
  const played = playedEvents();
  const rest = played.filter((e) => e.id !== lead?.id);

  if (!lead) {
    return (
      <p className="mt-12 font-serif italic text-xl text-muted">
        No results recorded for this season yet.
      </p>
    );
  }

  return (
    <div className="mt-12 flex flex-col gap-20">
      <section>
        <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
          {lead.major ? "The last major" : "Last played"} · {lead.name}
        </h2>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
          <div>
            <p className="kicker text-[9px] text-faint">
              {eventDates(lead)}
              {lead.venue && (
                <>
                  <span className="mx-2 text-rule">/</span>
                  {lead.venue}
                </>
              )}
            </p>

            {lead.winner && (
              <p className="font-serif text-lg text-muted mt-5">
                <span className="text-paper">{lead.winner}</span> won at{" "}
                {toPar(lead.leaderboard[0]?.score ?? "")}
                {lead.leaderboard[1] &&
                  `, ${marginOf(lead)} clear of ${lead.leaderboard[1].name}`}
                .
              </p>
            )}

            <ol className="mt-5">
              {lead.leaderboard.slice(0, 3).map((p, i) => (
                <li
                  key={`${p.position}-${p.name}`}
                  className="border-t border-rule py-4 flex items-baseline gap-4"
                >
                  <span className="kicker text-[10px] text-accent w-8 shrink-0">
                    {PLACE[i]}
                  </span>
                  <span className="display text-xl">{p.name}</span>
                  <span className="ml-auto tabular-nums text-muted">
                    {toPar(p.score)}
                  </span>
                </li>
              ))}
            </ol>

            <Leaderboard event={lead} />
          </div>

          <HighlightReel highlights={highlightsFor(golfKey(lead.id))} />
        </div>
      </section>

      {bigFour.length > 0 && (
        <section>
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            The majors
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bigFour.map((event) => (
              <div key={event.id} className="border-t border-rule pt-4">
                <p className="kicker text-[9px] text-faint">
                  {eventDates(event)}
                </p>
                <p className="font-body font-semibold text-[16px] mt-2">
                  {event.name}
                </p>
                <p className="display text-lg text-accent mt-2">
                  {event.winner ?? "—"}
                </p>
                {event.venue && (
                  <p className="text-[13px] text-muted mt-1">{event.venue}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap border-b border-rule pb-3">
          <h2 className="kicker text-[11px] text-accent">
            Every event of {store.season}
          </h2>
          <p className="kicker text-[9px] text-faint">{played.length} played</p>
        </div>

        <div className="mt-2 divide-y divide-[var(--rule)]">
          {rest.map((event) => (
            <div key={event.id} className="py-5">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="kicker text-[9px] text-faint w-20 shrink-0">
                  {eventDates(event)}
                </span>
                <span className="font-body font-semibold text-[16px]">
                  {event.name}
                  {event.major && <span className="ml-2 text-accent">★</span>}
                </span>
                {event.winner && (
                  <span className="text-[14px] text-accent ml-auto">
                    {event.winner}
                  </span>
                )}
              </div>
              <div className="mt-2 pl-0 sm:pl-[6.25rem]">
                <Leaderboard event={event} />
                <HighlightsToggle event={event} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[13px] text-faint">
        Leaderboards from ESPN&apos;s public scoreboard. Highlights are the
        rights holders&apos; own — the PGA Tour&apos;s, the R&amp;A&apos;s, the
        USGA&apos;s and each major&apos;s.
      </p>
    </div>
  );
}

/** How far clear the winner finished, written the way golf says it. */
function marginOf(event: GolfEvent) {
  const first = Number(event.leaderboard[0]?.score ?? 0);
  const second = Number(event.leaderboard[1]?.score ?? 0);
  const shots = Math.abs(second - first);
  if (!Number.isFinite(shots) || shots === 0) return "level";
  return `${shots} ${shots === 1 ? "shot" : "shots"}`;
}

function Leaderboard({ event }: { event: GolfEvent }) {
  if (event.leaderboard.length <= 3) return null;
  return (
    <details className="group mt-3">
      <summary className="kicker text-[9px] text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          Leaderboard, {event.leaderboard.length} players →
        </span>
        <span className="hidden group-open:inline">Hide leaderboard ↑</span>
      </summary>
      <div className="mt-4 max-h-[30rem] overflow-y-auto">
        <table className="w-full text-[14px]">
          <tbody>
            {event.leaderboard.map((p) => (
              <tr key={`${p.position}-${p.name}`} className="border-b border-rule">
                <td className="py-2 pr-4 text-faint tabular-nums w-10">
                  {p.position}
                </td>
                <td className="py-2 pr-4 font-body font-semibold">{p.name}</td>
                <td className="py-2 text-right tabular-nums text-muted">
                  {toPar(p.score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function HighlightsToggle({ event }: { event: GolfEvent }) {
  const reels = highlightsFor(golfKey(event.id));
  if (reels.length === 0) return null;
  return (
    <details className="group mt-3">
      <summary className="kicker text-[9px] text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">Watch the highlights →</span>
        <span className="hidden group-open:inline">Hide highlights ↑</span>
      </summary>
      <div className="mt-5">
        <HighlightReel highlights={reels} />
      </div>
    </details>
  );
}
