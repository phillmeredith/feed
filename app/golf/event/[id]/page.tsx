import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { SubNav } from "@/components/SubNav";
import { DeskTabs } from "@/components/DeskTabs";
import { HighlightReel } from "@/components/HighlightReel";
import { LastUpdated } from "@/components/EventStatus";
import { DataTable } from "@/components/ui/DataTable";
import { golfEventById, playedEvents, golfSeason } from "@/lib/golf";
import { highlightsFor, golfKey } from "@/lib/highlights";
import { sportDate } from "@/lib/format";

export const revalidate = 600;
export const maxDuration = 60;

export function generateStaticParams() {
  return playedEvents().slice(0, 20).map((event) => ({ id: event.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/golf/event/[id]">): Promise<Metadata> {
  const { id } = await params;
  const event = golfEventById(id);
  if (!event) return { title: "Not on the calendar — The Dispatch" };
  return {
    title: `${event.name} — The Dispatch`,
    description: `${event.name}: leaderboard, winner and highlights.`,
  };
}

/** Golf writes a score against par, and "E" rather than zero. */
function toPar(score: string) {
  if (!score || score === "0" || score === "E") return "E";
  return score.startsWith("-") || score.startsWith("+") ? score : `+${score}`;
}

const PLACE = ["1st", "2nd", "3rd"];

export default async function GolfEventPage({
  params,
}: PageProps<"/golf/event/[id]">) {
  const { id } = await params;
  const event = golfEventById(id);
  if (!event) notFound();

  const store = golfSeason();
  const reels = highlightsFor(golfKey(event.id));
  const played = playedEvents();
  const index = played.findIndex((e) => e.id === event.id);
  const newer = index > 0 ? played[index - 1] : null;
  const older = index >= 0 && index < played.length - 1 ? played[index + 1] : null;

  const dates = `${sportDate(event.startDate, { day: "numeric", month: "short" })}–${sportDate(event.endDate, { day: "numeric", month: "short" })}`;

  return (
    <>
      <Masthead />

      <main className="sheet py-10 flex-1 w-full">
        <header className="pb-2">
          <p className="display text-subhead text-muted">
            <Link href="/sport" className="hover:text-accent transition-colors">
              Sport
            </Link>
          </p>
          <SubNav group="sport" current="golf" />
          <p className="kicker text-micro text-accent mt-10">
            {event.major ? "A major" : "Tour event"}
            <span className="mx-2 text-rule">/</span>
            {dates}
          </p>
          <h1 className="display text-title mt-4">{event.name}</h1>
          {event.venue && (
            <p className="font-serif text-lede text-muted mt-3">{event.venue}</p>
          )}
          <DeskTabs desk="golf" current="season" />
        </header>

        <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            {event.leaderboard.length > 0 ? (
              <>
                <p className="panel-subtitle">The top of the board</p>
                <ol className="mt-near">
                  {event.leaderboard.slice(0, 3).map((player, i) => (
                    <li
                      key={`${player.position}-${player.name}`}
                      className="py-3 flex items-baseline gap-4"
                    >
                      <span className="kicker text-micro text-accent w-8 shrink-0">
                        {PLACE[i]}
                      </span>
                      <span className="display text-xl">{player.name}</span>
                      <span className="ml-auto figures text-muted">
                        {toPar(player.score)}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-band" data-density="reference">
                  <DataTable
                    caption={`${event.name} leaderboard`}
                    rows={event.leaderboard}
                    rowKey={(p, i) => `${p.position}-${p.name}-${i}`}
                    columns={[
                      {
                        key: "pos",
                        header: "#",
                        numeric: true,
                        width: "3.5rem",
                        cell: (p) => <span className="text-faint">{p.position}</span>,
                      },
                      {
                        key: "player",
                        header: "Player",
                        cell: (p) => (
                          <span className="font-body font-semibold">{p.name}</span>
                        ),
                      },
                      {
                        key: "score",
                        header: "To par",
                        align: "right",
                        numeric: true,
                        cell: (p) => (
                          <span className="text-muted">{toPar(p.score)}</span>
                        ),
                      },
                    ]}
                  />
                </div>
              </>
            ) : (
              <p className="font-serif text-lede text-muted">
                This one hasn&apos;t been played yet. The leaderboard appears
                here once it has.
              </p>
            )}
          </div>

          <aside>
            <p className="panel-subtitle">Highlights</p>
            <div className="mt-near">
              {reels.length > 0 ? (
                <HighlightReel highlights={reels} />
              ) : (
                <p className="font-serif italic text-muted">
                  No highlights package has been posted for this one.
                </p>
              )}
            </div>

            <nav className="mt-band flex items-center justify-between kicker text-micro">
              {older ? (
                <Link
                  href={`/golf/event/${older.id}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  ← {older.name.slice(0, 22)}
                </Link>
              ) : (
                <span className="text-faint">←</span>
              )}
              {newer ? (
                <Link
                  href={`/golf/event/${newer.id}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  {newer.name.slice(0, 22)} →
                </Link>
              ) : (
                <span className="text-faint">→</span>
              )}
            </nav>

            <div className="mt-band">
              <LastUpdated
                at={store.updated}
                source="ESPN's public scoreboard"
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
