import type { Metadata } from "next";
import { DeskView } from "@/components/DeskView";
import { GameCard } from "@/components/GameCard";
import { BandHead } from "@/components/Band";
import { allGames, isCalm, obscurity, CALM_BAR } from "@/lib/games";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calm games — The Dispatch",
  description:
    "Games with no aggression in them, ordered by how few people have played them. The opposite of a storefront front page.",
};

export default function CalmGames() {
  const calm = allGames().filter(isCalm);

  /* Three answers to three different evenings, from one list. */
  const buried = [...calm].sort((a, b) => obscurity(b) - obscurity(a)).slice(0, 12);
  const buriedIds = new Set(buried.map((g) => g.id));
  const calmest = [...calm]
    .filter((g) => !buriedIds.has(g.id))
    .sort((a, b) => b.calm - a.calm)
    .slice(0, 12);
  const seen = new Set([...buriedIds, ...calmest.map((g) => g.id)]);
  const newest = [...calm]
    .filter((g) => !seen.has(g.id))
    .sort((a, b) => b.released.localeCompare(a.released))
    .slice(0, 12);

  return (
    <DeskView
      desk="gaming"
      page={1}
      tab="calm"
      feed="none"
      panels={false}
      above={
        <div className="mt-12">
          <p className="standfirst max-w-[46em] text-[1.15rem]">
            Games with no aggression in them — scoring {CALM_BAR} or better on
            the calm scale — and, first, the ones almost nobody has played. A
            storefront cannot show you this page: it ranks by sales, and the
            whole point of a buried gem is that it did not have any.
          </p>
          <p className="source mt-4">
            {calm.length} calm games in the directory
          </p>

          <div className="mt-14">
            <BandHead
              weight="major"
              title="Buried, and worth digging up"
              note="Highly rated by the few who played them."
            />
            <div className="ruled mt-8 grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {buried.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>

          <div className="mt-14">
            <BandHead
              weight="major"
              title="The calmest things in the directory"
              note="Nothing chasing you, nothing to lose."
            />
            <div className="ruled mt-8 grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {calmest.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>

          {newest.length > 0 && (
            <div className="mt-14">
              <BandHead
                weight="major"
                title="Recently, and quietly"
                note="The newest of the calm ones."
              />
              <div className="ruled mt-8 grid grid-cols-1 items-start sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {newest.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
