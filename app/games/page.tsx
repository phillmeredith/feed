import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GameCard } from "@/components/GameCard";
import { GameFilters } from "@/components/GameFilters";
import { BandHead } from "@/components/Band";
import { allGames, allPlatforms, allTags, gamesUpdated, isCalm } from "@/lib/games";
import { parseQuery, runQuery } from "@/lib/gamesearch";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The games directory — The Dispatch",
  description:
    "Every console release the desk has recorded, sortable by how calm it is, how well it was liked and how few people played it — the three things a storefront will not rank on.",
};

const PAGE = 60;

export default async function GamesDirectory({
  searchParams,
}: PageProps<"/games">) {
  const query = parseQuery(await searchParams);
  const results = runQuery(query);
  const total = allGames().length;
  const calm = allGames().filter(isCalm).length;

  const updated = new Date(gamesUpdated()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <DeskView
      desk="gaming"
      page={1}
      tab="directory"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <p className="standfirst max-w-[46em] text-[1.15rem]">
            Every console release the desk has a record of, ordered by how calm
            it is rather than by how well it sold. A shop ranks by what moves,
            which is why the same twelve war games are always on the front page
            and why a small quiet thing is four screens down. This ranks on the
            three numbers a shop will not put together: how calm a game is, how
            well the people who played it rated it, and how few of them there
            were.
          </p>
          <p className="source mt-4">
            {total} games · {calm} of them calm · updated {updated}
          </p>

          <GameFilters
            query={query}
            platforms={allPlatforms()}
            tags={allTags()}
            showing={results.length}
            total={total}
          />

          {results.length === 0 ? (
            <p className="standfirst mt-12 font-serif text-xl italic">
              Nothing matches that. The directory only holds games the desk has
              been able to find tags for, so something very new or very obscure
              may simply not be in it yet.
            </p>
          ) : (
            <div className="ruled mt-10 grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {results.slice(0, PAGE).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {results.length > PAGE && (
            <p className="source mt-8 text-faint">
              Showing the first {PAGE} of {results.length}. Narrow it with a
              tag or a platform.
            </p>
          )}

          <div className="mt-16">
            <BandHead
              weight="major"
              title="How the calm score works"
              note="It is a sorting aid, not a verdict."
            />
            <p className="standfirst mt-6 max-w-[46em] text-small">
              Players tag games on Steam, and those tags carry the thing a
              genre never does — “Relaxing” and “Cozy” are not genres, and they
              are exactly what somebody hunting a quiet evening is looking for.
              The score weighs the calm tags against the aggressive ones,
              counting a tag for more when players have voted it near the top,
              and pulls anything thinly described back toward the middle. It
              puts Unpacking at +84 and Spiritfarer at +83; Elden Ring at −63
              and DOOM Eternal at −74.
            </p>
          </div>
        </div>
      }
    />
  );
}
