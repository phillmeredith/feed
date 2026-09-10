import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { EntityHead } from "@/components/PageHead";
import { BandHead } from "@/components/Band";
import { GameCard } from "@/components/GameCard";
import { Media, Plate } from "@/components/Media";
import { steamDetail, steamReviews } from "@/lib/steam";
import {
  allGames,
  gameBySlug,
  isCalm,
  obscurity,
  reach,
  sharedTags,
  similarTo,
} from "@/lib/games";

export const revalidate = 3600;

/* The recent slice is prerendered and the tail renders on first request,
   which keeps the build quick — the same arrangement the gear directory and
   the model catalogue use. */
export function generateStaticParams() {
  return allGames()
    .slice(0, 80)
    .map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = gameBySlug(slug);
  if (!game) return { title: "Not in the directory — The Dispatch" };
  return { title: `${game.name} — The Dispatch`, description: game.short };
}

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-b border-rule py-3 last:border-b-0">
      <p className="source">{label}</p>
      <p className="headline mt-1 text-[1.35rem] font-medium figures">{value}</p>
      {note && <p className="source mt-1 text-faint">{note}</p>}
    </div>
  );
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = gameBySlug(slug);
  if (!game) notFound();

  /* Both are cached for a day; a game's copy rarely changes and its reviews
     do, which is the right way round for the one that is fetched live. */
  const [detail, reviews] = await Promise.all([
    steamDetail(game.id),
    steamReviews(game.id),
  ]);

  const alike = similarTo(game, allGames());
  const gem = obscurity(game);

  return (
    <>
      <Masthead />

      <main className="sheet flex-1 w-full pb-24 pt-7">
        <EntityHead
          trail={[
            { label: "The games directory", href: "/games" },
            { label: game.platforms[0] ?? "Games" },
          ]}
          title={game.name}
          note={game.short || undefined}
          meta={
            <>
              {new Date(game.released).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {game.developer && ` · ${game.developer}`}
            </>
          }
        />

        <div className="mt-12 grid gap-x-gutter gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            {(game.shot || game.image) && (
              <Plate
                src={game.shot || game.image}
                credit="Steam"
                ratio="hero"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
            )}

            {detail?.about && (
              <div
                className="article-body mt-8 text-[1.05rem] leading-[1.6]"
                dangerouslySetInnerHTML={{ __html: detail.about }}
              />
            )}

            {detail && detail.shots.length > 1 && (
              <div className="mt-10">
                <h2 className="panel-title">What it looks like</h2>
                {/*
                  * Screenshots, not the marketing capsule. The capsule is a
                  * 460×215 image with the title lettered across it; cropped to
                  * a card it cut the words in half and showed no game at all.
                  */}
                <div className="ruled mt-5 grid grid-cols-2 lg:grid-cols-3">
                  {detail.shots.slice(1, 7).map((shot) => (
                    <a
                      key={shot.full}
                      href={shot.full}
                      target="_blank"
                      rel="noreferrer"
                      className="group block py-2"
                    >
                      <Media
                        src={shot.thumb}
                        ratio="hero"
                        sizes="(max-width: 640px) 50vw, 20vw"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {detail?.trailer?.mp4 && (
              <div className="mt-10">
                <h2 className="panel-title">The trailer</h2>
                <video
                  className="media mt-5 w-full"
                  controls
                  preload="none"
                  poster={detail.trailer.thumb}
                  src={detail.trailer.mp4}
                />
              </div>
            )}

            {reviews && reviews.sample.length > 0 && (
              <div className="mt-12">
                <BandHead
                  weight="major"
                  title="What players said"
                  note={`${reviews.summary} · ${Math.round((reviews.positive / reviews.total) * 100)}% of ${reviews.total.toLocaleString("en-GB")} reviews`}
                />
                <div className="mt-6 flex flex-col gap-6">
                  {reviews.sample.map((review, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 pl-5"
                      style={{
                        borderColor: review.positive
                          ? "var(--positive)"
                          : "var(--accent)",
                      }}
                    >
                      <p className="standfirst text-[1.05rem] leading-[1.55]">
                        {review.text.slice(0, 460)}
                        {review.text.length > 460 && "…"}
                      </p>
                      <p className="source mt-2">
                        {review.positive ? "Recommended" : "Not recommended"}
                        {review.hours !== null && ` · ${review.hours} hours played`}
                        {review.helpful > 0 && ` · ${review.helpful} found this helpful`}
                      </p>
                    </blockquote>
                  ))}
                </div>
                <p className="source mt-5 text-faint">
                  The most-upvoted reviews on Steam, positive and negative.
                </p>
              </div>
            )}
          </div>

          <div className="lg:rule-l">
            <h2 className="panel-title">Where it sits</h2>
            <div className="mt-2">
              <Figure
                label="Calm"
                value={game.calm > 0 ? `+${game.calm}` : String(game.calm)}
                note={
                  isCalm(game)
                    ? "Calm enough to put on without bracing yourself."
                    : "Not one for a quiet evening."
                }
              />
              {game.regard !== null && (
                <Figure
                  label="Liked it"
                  value={`${game.regard}%`}
                  note={`of ${game.reviews.toLocaleString("en-GB")} reviews`}
                />
              )}
              <Figure
                label="Players"
                value={reach(game)}
                note="the band SteamSpy puts it in, not a count"
              />
              {gem >= 30 && (
                <Figure
                  label="Buried gem"
                  value={String(gem)}
                  note="Well thought of, and hardly anybody got there."
                />
              )}
            </div>

            {detail?.metacritic && (
              <div className="mt-8">
                <h2 className="panel-title">Metacritic</h2>
                <p className="headline mt-3 text-[1.35rem] font-medium figures">
                  {detail.metacritic.score}
                  <span className="source ml-2 text-faint">out of 100</span>
                </p>
              </div>
            )}

            {detail && detail.features.length > 0 && (
              <div className="mt-8">
                <h2 className="panel-title">How it plays</h2>
                <p className="standfirst mt-3 text-small">
                  {detail.features.join(" · ")}
                </p>
              </div>
            )}

            <h2 className="panel-title mt-8">What players call it</h2>
            {/* Each one filters the directory, which is the quickest route
                from "I liked this" to "what else is like it". */}
            <div className="mt-4 flex flex-wrap gap-2">
              {game.tags.slice(0, 14).map((tag) => (
                <Link
                  key={tag}
                  href={`/games?tag=${encodeURIComponent(tag)}`}
                  className="kicker border border-rule-strong px-2.5 py-1.5 text-micro text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <h2 className="panel-title mt-8">On</h2>
            <p className="standfirst mt-3 text-small">
              {game.platforms.join(" · ")}
            </p>

            {game.genres.length > 0 && (
              <>
                <h2 className="panel-title mt-8">Filed as</h2>
                <p className="standfirst mt-3 text-small">
                  {game.genres.join(" · ")}
                </p>
              </>
            )}
          </div>
        </div>

        {alike.length > 0 && (
          <div className="mt-16">
            <BandHead
              weight="major"
              title={`If you liked ${game.name}`}
              note="Matched on what players called both of them, and on being about as calm."
            />
            <div className="ruled mt-8 grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {alike.map((other) => (
                <div key={other.id}>
                  <GameCard game={other} />
                  {/* Say why, rather than asking for trust. */}
                  <p className="source mt-2 text-faint">
                    both {sharedTags(game, other).join(", ").toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
