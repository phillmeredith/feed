import Link from "next/link";
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
import { sportDate } from "@/lib/format";
import { HighlightReel } from "./HighlightReel";
import { LastUpdated, WhenLine, stateFor } from "./EventStatus";

/*
 * A card at 02:00Z is the previous evening in the United States and the small
 * hours here, so the day it lands on depends entirely on the zone you render
 * it in. This one renders in London's, explicitly.
 */
function eventDate(date: string) {
  return sportDate(date, { weekday: "short", day: "numeric", month: "short" });
}

/**
 * One bout, as a line.
 *
 * Both corners, the winner marked, and how it ended. A bout that hasn't
 * happened shows the matchup and nothing more — there is no result to imply.
 */
/**
 * `reveal` governs the whole line, not just the result string: the winner is
 * marked by weight as well as by words, so hiding one and not the other tells
 * you who won just as plainly.
 */
function Bout({ fight, reveal }: { fight: Fight; reveal: boolean }) {
  const [red, blue] = fight.fighters;
  const result = resultLine(fight);

  return (
    <li className="py-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="kicker text-micro text-faint w-28 shrink-0">
        {fight.weightClass}
      </span>
      <span className="font-body text-small min-w-0">
        <span
          className={
            reveal && fight.winner === red
              ? "font-semibold text-paper"
              : "text-muted"
          }
        >
          {red}
        </span>
        <span className="mx-2 text-faint text-fine">v</span>
        <span
          className={
            reveal && fight.winner === blue
              ? "font-semibold text-paper"
              : "text-muted"
          }
        >
          {blue}
        </span>
      </span>
      {reveal && result && (
        <span className="kicker text-micro text-accent ml-auto">{result}</span>
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
function MainCard({ event, reveal }: { event: UfcEvent; reveal: boolean }) {
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
      <h3 className="kicker text-micro text-muted mt-8">Main card</h3>
      <ul className="mt-2">
        {[...card].reverse().map((fight, i) => (
          <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} reveal={reveal} />
        ))}
      </ul>

      {reveal && reels.length > 0 && (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...reels].reverse().map(({ fight, videos }) => (
            <div key={fight.fighters.join()}>
              <HighlightReel highlights={videos.slice(0, 1)} />
              <p className="font-body font-semibold text-small leading-snug mt-1">
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
function Prelims({ event, reveal }: { event: UfcEvent; reveal: boolean }) {
  const card = prelims(event);
  if (card.length === 0) return null;

  return (
    <details className="group mt-8">
      <summary className="kicker text-micro text-muted hover:text-accent cursor-pointer list-none">
        <span className="group-open:hidden">
          Prelims, {card.length} bouts →
        </span>
        <span className="hidden group-open:inline">Hide prelims ↑</span>
      </summary>
      <ul className="mt-2">
        {[...card].reverse().map((fight, i) => (
          <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} reveal={reveal} />
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
export function UfcNextCard() {
  const store = ufcSeason();
  const next = nextEvent();
  const done = completedEvents();
  const [latest] = done;

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
          <h2 className="panel-title">
            Next card
          </h2>
          <p className="display text-2xl sm:text-3xl mt-6">{next.name}</p>
          <div className="mt-3">
            {/* The first bell in London time, with the zone named — these
                start at two in the morning here as often as not. */}
            <WhenLine
              at={next.date}
              state={stateFor({
                startsAt: next.date,
                finished: false,
                hasCard: next.fights.length > 0,
              })}
              place={next.location}
            />
          </div>
          {next.fights.length > 0 ? (
            <ul className="mt-6">
              {[...next.fights].reverse().map((fight, i) => (
                <Bout
                  key={`${fight.fighters.join()}-${i}`}
                  fight={fight}
                  reveal
                />
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
          <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-label text-accent">
              Last card · {latest.name}
            </h2>
          </div>
          <p className="kicker text-micro text-faint mt-5">
            {eventDate(latest.date)}
            {latest.location && (
              <>
                <span className="mx-2 text-rule">/</span>
                {latest.location}
              </>
            )}
          </p>
          {/* One disclosure for the whole bill; thirteen would be unusable. */}
          <MainCard event={latest} reveal />
          <Prelims event={latest} reveal />
          {/* The bill itself is not a spoiler, so it stays readable. */}
          <div className="mt-8">
            <p className="kicker text-micro text-muted">Who fought</p>
            <MainCard event={latest} reveal={false} />
          </div>
        </section>
      )}

      <LastUpdated
        at={store.updated}
        source="Cards and results from ESPN's public scoreboard; highlights from the broadcast rights holders"
      />
    </div>
  );
}

/** Every card of the year, oldest at the foot. */
export function UfcAllCards() {
  const store = ufcSeason();
  const done = completedEvents();
  const [, ...earlier] = done;

  if (done.length === 0) {
    return (
      <p className="mt-12 font-serif italic text-xl text-muted">
        No cards recorded for this season yet.
      </p>
    );
  }

  return (
    <div className="mt-12 flex flex-col gap-20">
      {earlier.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-6 flex-wrap border-b border-rule pb-3">
            <h2 className="kicker text-label text-accent">
              Every card of {store.season}
            </h2>
            <p className="kicker text-micro text-faint">
              {done.length} fought
            </p>
          </div>

          <div className="mt-2 grid gap-x-16 lg:grid-cols-2">
            {earlier.map((event) => {
              const headline = event.fights[event.fights.length - 1];
              return (
                /*
                 * A row links to the card rather than expanding into one.
                 * It used to unfold the whole bill in place, which is the
                 * card page's job and was the same markup twice.
                 */
                <div key={event.id} className="py-4">
                  <Link
                    href={`/ufc/card/${event.id}`}
                    className="group flex flex-wrap items-baseline gap-x-5 gap-y-1"
                  >
                    <span className="kicker text-micro text-faint w-24 shrink-0">
                      {eventDate(event.date)}
                    </span>
                    <span className="font-body font-semibold text-body group-hover:text-accent transition-colors">
                      {event.name}
                    </span>
                    {headline?.winner && (
                      <span className="text-small text-accent ml-auto">
                        {headline.winner}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <LastUpdated
        at={store.updated}
        source="Cards and results from ESPN's public scoreboard; highlights from the broadcast rights holders — the UFC posts clips rather than packages, so prelims have results but no video"
      />
    </div>
  );
}
