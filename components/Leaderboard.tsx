import { leaderboard, modelName, type Benchmark } from "@/lib/benchmarks";

/**
 * Who is top, right now.
 *
 * Ranked bars with the figure printed on the bar, so a reader gets the number
 * without tracing it back to an axis — and the direction said in words above
 * it, because on half these boards a high score is the good one and on the
 * other half it is not obvious which.
 *
 * Horizontal rather than the vertical bars this convention usually uses.
 * Model names run to thirty characters, and vertical bars mean turning them
 * on their side; in a column of a newspaper they read straight across.
 */
export function Leaderboard({
  benchmark,
  count = 8,
}: {
  benchmark: Benchmark;
  count?: number;
}) {
  const rows = leaderboard(benchmark, count);
  if (rows.length === 0) return null;

  // Scaled to the leader, not to the ceiling: the difference between the top
  // eight is the thing being read, and against a fixed ceiling on a
  // saturated board every bar is the same length.
  const top = rows[0].score;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-ink pb-2.5">
        <h3 className="kicker text-micro tracking-[0.2em] text-ink">
          {benchmark.name}
        </h3>
        <span className="source text-faint">higher is better</span>
      </div>

      <p className="standfirst mt-3 text-small">{benchmark.asks}</p>

      <ol className="mt-5">
        {rows.map((row, i) => {
          const { name, effort } = modelName(row.model);
          return (
            <li key={row.model} className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline gap-3">
                <span className="source w-4 shrink-0 text-faint figures">
                  {i + 1}
                </span>
                <span className="headline min-w-0 flex-1 truncate text-[1.05rem] font-medium leading-[1.2]">
                  {name}
                  {effort && (
                    <span className="source ml-2 text-faint">{effort}</span>
                  )}
                </span>
                <span className="source figures shrink-0 text-ink">
                  {Math.round(row.score * 100)}%
                </span>
              </div>
              {/* The bar is a share of the track, and the track is what is
                  left after the rank number — a percentage width on top of a
                  left margin adds up to more than the row on a narrow
                  column. */}
              <span aria-hidden="true" className="mt-1.5 ml-7 block">
                <span
                  className="block h-[6px] bg-[var(--series-3)]"
                  style={{ width: `${(row.score / top) * 100}%` }}
                />
              </span>
            </li>
          );
        })}
      </ol>

      <p className="source mt-3 text-faint">
        {rows[0].org} leads · best of {benchmark.scores.length} scored
      </p>
    </section>
  );
}
