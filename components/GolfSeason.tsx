import { latestEvent, majors, playedEvents, golfSeason } from "@/lib/golf";
import type { GolfEvent } from "@/lib/golf";
import { highlightsFor, golfKey } from "@/lib/highlights";
import { HighlightReel } from "./HighlightReel";
import { DataTable } from "./ui/DataTable";
import { SpoilerGuard, SpoilerToggle } from "./SpoilerGuard";
import { LastUpdated } from "./EventStatus";
import { sportDate } from "@/lib/format";

function eventDates(event: GolfEvent) {
  // London time, not the server's; a major spans four days and the boundaries matter.
  const sameMonth =
    new Date(event.startDate).getMonth() === new Date(event.endDate).getMonth();
  const from = sportDate(event.startDate, {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" }),
  });
  const to = sportDate(event.endDate, { day: "numeric", month: "short" });
  return `${from}–${to}`;
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
export function GolfThisWeek() {
  const store = golfSeason();
  const lead = latestEvent();

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
        <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
          <h2 className="kicker text-label text-accent">
            {lead.major ? "The last major" : "Last played"} · {lead.name}
          </h2>
          <SpoilerToggle />
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
          <div>
            <p className="kicker text-micro text-faint">
              {eventDates(lead)}
              {lead.venue && (
                <>
                  <span className="mx-2 text-rule">/</span>
                  {lead.venue}
                </>
              )}
            </p>

            <SpoilerGuard label="Result and highlights">
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
                  <span className="kicker text-micro text-accent w-8 shrink-0">
                    {PLACE[i]}
                  </span>
                  <span className="display text-xl">{p.name}</span>
                  <span className="ml-auto figures text-muted">
                    {toPar(p.score)}
                  </span>
                </li>
              ))}
            </ol>

            <Leaderboard event={lead} />
            </SpoilerGuard>
          </div>

          {highlightsFor(golfKey(lead.id)).length > 0 ? (
            <HighlightReel highlights={highlightsFor(golfKey(lead.id))} />
          ) : (
            <p className="font-serif italic text-muted">
              No highlights package has been posted for this one yet.
            </p>
          )}
        </div>
      </section>

      <LastUpdated
        at={store.updated}
        source="Leaderboards from ESPN's public scoreboard; highlights from the rights holders"
      />
    </div>
  );
}

/** The four that decide a career, on their own page. */
export function GolfMajors() {
  const store = golfSeason();
  const bigFour = majors();

  if (bigFour.length === 0) {
    return (
      <p className="mt-12 font-serif italic text-xl text-muted">
        No majors have been played this season yet.
      </p>
    );
  }

  return (
    <div className="mt-12 flex flex-col gap-20">
      {bigFour.length > 0 && (
        <section>
          <h2 className="panel-title">
            The majors
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bigFour.map((event) => (
              <div key={event.id} className="border-t border-rule pt-4">
                <p className="kicker text-micro text-faint">
                  {eventDates(event)}
                </p>
                <p className="font-body font-semibold text-body mt-2">
                  {event.name}
                </p>
                <div className="mt-2">
                  <SpoilerGuard label="Winner">
                    <p className="display text-lg text-accent">
                      {event.winner ?? "—"}
                    </p>
                  </SpoilerGuard>
                </div>
                {event.venue && (
                  <p className="text-fine text-muted mt-1">{event.venue}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <LastUpdated
        at={store.updated}
        source="Leaderboards from ESPN's public scoreboard"
      />
    </div>
  );
}

/** Every event of the year. */
export function GolfAllEvents() {
  const store = golfSeason();
  const lead = latestEvent();
  const played = playedEvents();
  const rest = played.filter((e) => e.id !== lead?.id);

  if (played.length === 0) {
    return (
      <p className="mt-12 font-serif italic text-xl text-muted">
        No results recorded for this season yet.
      </p>
    );
  }

  return (
    <div className="mt-12 flex flex-col gap-20">
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap border-b border-rule pb-3">
          <h2 className="kicker text-label text-accent">
            Every event of {store.season}
          </h2>
          <p className="kicker text-micro text-faint">{played.length} played</p>
        </div>

        {/* Two columns, for the same reason the F1 calendar has them: a
            season down one narrow column is mostly empty row. */}
        <div className="mt-2 grid gap-x-16 lg:grid-cols-2">
          {rest.map((event) => (
            <div key={event.id} className="border-t border-rule py-5">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="kicker text-micro text-faint w-20 shrink-0">
                  {eventDates(event)}
                </span>
                <span className="font-body font-semibold text-body">
                  {event.name}
                  {event.major && <span className="ml-2 text-accent">★</span>}
                </span>
                {event.winner && (
                  <span className="ml-auto">
                    <SpoilerGuard label="Winner">
                      <span className="text-small text-accent">
                        {event.winner}
                      </span>
                    </SpoilerGuard>
                  </span>
                )}
              </div>
              <div className="mt-2 pl-0 sm:pl-[6.25rem]">
                <Leaderboard event={event} limit={12} />
                <HighlightsToggle event={event} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <LastUpdated
        at={store.updated}
        source="Leaderboards from ESPN's public scoreboard; highlights from the rights holders — the PGA Tour, the R&A, the USGA and each major"
      />
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

/**
 * The leaderboard, folded away — but only as much of it as is worth shipping.
 *
 * A <details> hides its contents; it does not avoid sending them. Rendering
 * every player of every event of the season put 2.8MB of HTML on this page,
 * almost all of it inside collapsed elements nobody opens. The event the page
 * leads on gets its full field; the season list gets the part of a
 * leaderboard anyone reads.
 */
function Leaderboard({
  event,
  limit,
}: {
  event: GolfEvent;
  limit?: number;
}) {
  if (event.leaderboard.length <= 3) return null;
  const rows = limit ? event.leaderboard.slice(0, limit) : event.leaderboard;
  return (
    <details className="group mt-3">
      <summary className="kicker text-micro text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          Leaderboard{limit ? `, top ${rows.length}` : `, ${rows.length} players`} →
        </span>
        <span className="hidden group-open:inline">Hide leaderboard ↑</span>
      </summary>
      <div className="mt-4 max-h-[30rem] overflow-y-auto" data-density="reference">
        <DataTable
          caption={`${event.name} leaderboard`}
          rows={rows}
          rowKey={(p) => `${p.position}-${p.name}`}
          columns={[
            { key: "pos", header: "#", numeric: true, width: "3.5rem",
              cell: (p) => <span className="text-faint">{p.position}</span> },
            { key: "player", header: "Player",
              cell: (p) => <span className="font-body font-semibold">{p.name}</span> },
            { key: "score", header: "To par", align: "right", numeric: true,
              cell: (p) => <span className="text-muted">{toPar(p.score)}</span> },
          ]}
        />
      </div>
    </details>
  );
}

function HighlightsToggle({ event }: { event: GolfEvent }) {
  const reels = highlightsFor(golfKey(event.id));
  if (reels.length === 0) return null;
  return (
    <details className="group mt-3">
      <summary className="kicker text-micro text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">Watch the highlights →</span>
        <span className="hidden group-open:inline">Hide highlights ↑</span>
      </summary>
      <div className="mt-5">
        <HighlightReel highlights={reels} />
      </div>
    </details>
  );
}
