import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { EntityHead } from "@/components/PageHead";
import { HighlightReel } from "@/components/HighlightReel";
import { LastUpdated, WhenLine, stateFor } from "@/components/EventStatus";
import {
  ufcSeason,
  completedEvents,
  mainCard,
  prelims,
  resultLine,
  type Fight,
} from "@/lib/ufc";
import { highlightsFor, ufcKey } from "@/lib/highlights";

export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams() {
  return completedEvents()
    .slice(0, 20)
    .map((event) => ({ id: event.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ufc/card/[id]">): Promise<Metadata> {
  const { id } = await params;
  const event = ufcSeason().events.find((e) => e.id === id);
  if (!event) return { title: "Not on the calendar — The Dispatch" };
  return {
    title: `${event.name} — The Dispatch`,
    description: `${event.name}: the full bill, main card and prelims, with highlights.`,
  };
}

function Bout({ fight }: { fight: Fight }) {
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
            fight.winner === red ? "font-semibold text-ink" : "text-muted"
          }
        >
          {red}
        </span>
        <span className="mx-2 text-faint text-fine">v</span>
        <span
          className={
            fight.winner === blue ? "font-semibold text-ink" : "text-muted"
          }
        >
          {blue}
        </span>
      </span>
      {result && (
        <span className="kicker text-micro text-accent ml-auto">{result}</span>
      )}
    </li>
  );
}

function Card({ fights }: { fights: Fight[] }) {
  return (
    <ul>
      {[...fights].reverse().map((fight, i) => (
        <Bout key={`${fight.fighters.join()}-${i}`} fight={fight} />
      ))}
    </ul>
  );
}

export default async function UfcCardPage({
  params,
}: PageProps<"/ufc/card/[id]">) {
  const { id } = await params;
  const store = ufcSeason();
  const event = store.events.find((e) => e.id === id);
  if (!event) notFound();

  const main = mainCard(event);
  const under = prelims(event);
  const done = completedEvents();
  const index = done.findIndex((e) => e.id === event.id);
  const newer = index > 0 ? done[index - 1] : null;
  const older = index >= 0 && index < done.length - 1 ? done[index + 1] : null;

  const reels = main
    .map((fight) => ({
      fight,
      videos: highlightsFor(ufcKey(event.id, event.fights.indexOf(fight))),
    }))
    .filter((entry) => entry.videos.length > 0);

  return (
    <>
      <Masthead />

      <main className="sheet flex-1 w-full pb-24 pt-7">
        <EntityHead
          subnav={{ group: "sport", current: "ufc" }}
          trail={[
            { label: "The UFC", href: "/ufc" },
            { label: "Cards", href: "/ufc/cards" },
          ]}
          title={event.name}
          tabs={{ desk: "ufc", current: "cards" }}
        >
          <WhenLine
            at={event.date}
            state={stateFor({
              startsAt: event.date,
              finished: event.status === "Final",
              hasCard: event.fights.length > 0,
            })}
            place={event.location}
          />
        </EntityHead>

        <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            {main.length > 0 && (
              <>
                <p className="panel-subtitle">Main card</p>
                <div className="mt-near">
                  <Card fights={main} />
                </div>
              </>
            )}

            {under.length > 0 && (
              <div className="mt-band">
                <p className="panel-subtitle">Prelims</p>
                <div className="mt-near">
                  <Card fights={under} />
                </div>
              </div>
            )}

            {event.fights.length === 0 && (
              <p className="font-serif text-lede text-muted">
                The bill for this card hasn&apos;t been announced yet.
              </p>
            )}
          </div>

          <aside>
            <p className="panel-subtitle">Highlights</p>
            <div className="mt-near">
              {reels.length > 0 ? (
                <div className="flex flex-col gap-8">
                  {[...reels].reverse().map(({ fight, videos }) => (
                    <div key={fight.fighters.join()}>
                      <HighlightReel highlights={videos.slice(0, 1)} />
                      <p className="font-body font-semibold text-small leading-snug mt-1">
                        {fight.fighters.join(" v ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-serif italic text-muted">
                  {event.status === "Final"
                    ? "No highlights have been posted for this card."
                    : "Highlights appear here after the card."}
                </p>
              )}
            </div>

            <nav className="mt-band flex items-center justify-between kicker text-micro">
              {older ? (
                <Link
                  href={`/ufc/card/${older.id}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  ← Previous card
                </Link>
              ) : (
                <span className="text-faint">←</span>
              )}
              {newer ? (
                <Link
                  href={`/ufc/card/${newer.id}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  Next card →
                </Link>
              ) : (
                <span className="text-faint">→</span>
              )}
            </nav>

            <div className="mt-band">
              <LastUpdated at={store.updated} source="ESPN's public scoreboard" />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
