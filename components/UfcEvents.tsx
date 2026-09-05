import {
  ufcSeason,
  completedEvents,
  nextEvent,
  mainCard,
  prelims,
  resultLine,
  type Fight,
  type UfcEvent,
} from "@/lib/ufc";
import { highlightsFor, ufcKey } from "@/lib/highlights";
import { HighlightReel } from "./HighlightReel";

function eventDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * One bout, as a line.
 *
 * Both corners, the winner marked, and how it ended. A bout that hasn't
 * happened shows the matchup and nothing more — there is no result to imply.
 */
function Bout({ fight }: { fight: Fight }) {
  const [red, blue] = fight.fighters;
  const result = resultLine(fight);

  return (
    <li className="border-t border-rule py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="kicker text-[9px] text-faint w-28 shrink-0">
        {fight.weightClass}
      </span>
      <span className="font-body text-[15px] min-w-0">
        <span
          className={
            fight.winner === red ? "font-semibold text-paper" : "text-muted"
          }
        >
          {red}
        </span>
        <span className="mx-2 text-faint text-[13px]">v</span>
        <span
          className={
            fight.winner === blue ? "font-semibold text-paper" : "text-muted"
          }
        >
          {blue}
        </span>
      </span>
      {result && (
        <span className="kicker text-[9px] text-accent ml-auto">{result}</span>
      )}
    </li>
  );
}

/**
 * The main card, with its highlights.
 *
 * The captions are written from the result rather than lifted from the video,
 * because the broadcaster's titles are all capitals and shouting emoji and
 * this is not that kind of page.
 */
function MainCard({ event }: { event: UfcEvent }) {
  const card = mainCard(event);
  if (card.length === 0) return null;

  const reels = card
    .map((fight) => ({
      fight,
      videos: highlightsFor(ufcKey(event.id, event.fights.indexOf(fight))),
    }))
    .filter((entry) => entry.videos.length > 0);

  return (
    <>
      <h3 className="kicker text-[10px] text-muted mt-8">Main card</h3>
      <ul className="mt-2">
        {[...card].reverse().map((fight, i) => (
          <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} />
        ))}
      </ul>

      {reels.length > 0 && (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...reels].reverse().map(({ fight, videos }) => (
            <div key={fight.fighters.join()}>
              <HighlightReel highlights={videos.slice(0, 1)} />
              <p className="font-body font-semibold text-[14px] leading-snug mt-1">
                {fight.fighters.join(" v ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** The prelims: results, and no video — nobody packages highlights for these. */
function Prelims({ event }: { event: UfcEvent }) {
  const card = prelims(event);
  if (card.length === 0) return null;

  return (
    <details className="group mt-8">
      <summary className="kicker text-[10px] text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          Prelims, {card.length} bouts →
        </span>
        <span className="hidden group-open:inline">Hide prelims ↑</span>
      </summary>
      <ul className="mt-2">
        {[...card].reverse().map((fight, i) => (
          <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} />
        ))}
      </ul>
    </details>
  );
}

/**
 * The UFC calendar, in the order a reader thinks in.
 *
 * What's next, then what just happened, then back through the year. A card
 * that hasn't been fought carries its bookings and nothing else.
 */
export function UfcEvents() {
  const store = ufcSeason();
  const next = nextEvent();
  const done = completedEvents();
  const [latest, ...earlier] = done;

  if (!next && done.length === 0) {
    return (
      <p className="mt-12 font-serif italic text-xl text-muted">
        No cards recorded for this season yet.
      </p>
    );
  }

  return (
    <div className="mt-12 flex flex-col gap-20">
      {next && (
        <section>
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Next card
          </h2>
          <p className="display text-2xl sm:text-3xl mt-6">{next.name}</p>
          <p className="kicker text-[9px] text-faint mt-3">
            {eventDate(next.date)}
            {next.location && (
              <>
                <span className="mx-2 text-rule">/</span>
                {next.location}
              </>
            )}
          </p>
          {next.fights.length > 0 ? (
            <ul className="mt-6">
              {[...next.fights].reverse().map((fight, i) => (
                <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} />
              ))}
            </ul>
          ) : (
            <p className="font-serif italic text-muted mt-5">
              The card hasn&apos;t been announced yet.
            </p>
          )}
        </section>
      )}

      {latest && (
        <section>
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Last card · {latest.name}
          </h2>
          <p className="kicker text-[9px] text-faint mt-5">
            {eventDate(latest.date)}
            {latest.location && (
              <>
                <span className="mx-2 text-rule">/</span>
                {latest.location}
              </>
            )}
          </p>
          <MainCard event={latest} />
          <Prelims event={latest} />
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-[11px] text-accent">
              Every card of {store.season}
            </h2>
            <p className="kicker text-[9px] text-faint">
              {done.length} fought
            </p>
          </div>

          <div className="mt-2 divide-y divide-[var(--rule)]">
            {earlier.map((event) => {
              const headline = event.fights[event.fights.length - 1];
              return (
                <details key={event.id} className="group py-5">
                  <summary className="cursor-pointer list-none flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <span className="kicker text-[9px] text-faint w-24 shrink-0">
                      {eventDate(event.date)}
                    </span>
                    <span className="font-body font-semibold text-[16px] group-hover:text-accent transition-colors">
                      {event.name}
                    </span>
                    {headline?.winner && (
                      <span className="text-[14px] text-accent ml-auto">
                        {headline.winner}
                      </span>
                    )}
                  </summary>
                  <div className="mt-1 pl-0 sm:pl-[7.25rem]">
                    <MainCard event={event} />
                    <Prelims event={event} />
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-[13px] text-faint">
        Cards and results from ESPN&apos;s public scoreboard. Highlights are the
        broadcast rights holders&apos; own — the UFC posts clips rather than
        packages, so the prelims have results here but no video.
      </p>
    </div>
  );
}
