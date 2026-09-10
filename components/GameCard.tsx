import Link from "next/link";
import { Media } from "./Media";
import { isCalm, obscurity, type Game } from "@/lib/games";

/**
 * How a game reads in a list: what it is, how calm, how well thought of, and
 * how few people got there first.
 *
 * The last of those is the one a storefront never prints, and is the reason
 * this directory exists.
 */
export function GameCard({ game }: { game: Game }) {
  const gem = obscurity(game);

  return (
    <article className="group border-b border-rule py-5">
      <Link href={`/games/${game.slug}`} className="story block">
        {(game.shot || game.image) && (
          <Media
            src={game.shot || game.image}
            ratio="landscape"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 22vw"
            className="mb-4"
          />
        )}

        <h3 className="headline text-[1.25rem] font-medium leading-[1.18]">
          {game.name}
        </h3>

        <p className="source mt-2">
          {game.released.slice(0, 4)}
          {game.developer && <> · {game.developer}</>}
        </p>

        <p className="source mt-1 text-faint">{game.platforms.join(" · ")}</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="source">
            <b className="figures">{game.calm > 0 ? `+${game.calm}` : game.calm}</b>{" "}
            {isCalm(game) ? <span className="text-accent">calm</span> : "calm"}
          </span>
          {game.regard !== null && (
            <span className="source">
              <b className="figures">{game.regard}%</b> liked it
            </span>
          )}
          {gem >= 30 && (
            <span className="source text-accent">buried gem</span>
          )}
        </div>
      </Link>
    </article>
  );
}
