import { frontier, type Benchmark } from "@/lib/benchmarks";

/*
 * A benchmark over its whole life, on one sheet.
 *
 * Time across, score up, one dot per model — and a stepped line through the
 * models that beat everything before them, which is the only line in this
 * history anybody argues about.
 *
 * Two marks make the difference between a chart and a decoration. The
 * baseline is what a model scores by guessing: on GPQA that is 25%, so the
 * bottom quarter of the chart is not achievement and is shaded out of the
 * way. The ceiling is the highest attainable score, and a leader crowding it
 * means the benchmark has stopped measuring rather than that progress
 * stopped — which is exactly what happened to MMLU and GSM8K, kept here for
 * that reason.
 *
 * Server-rendered SVG. No chart library and no script: it is a picture of a
 * table, and it prints.
 */

const W = 1600;
const H = 520;
const PAD = { top: 30, right: 30, bottom: 46, left: 66 };

export function BenchmarkMap({
  benchmark,
  height = H,
}: {
  benchmark: Benchmark;
  height?: number;
}) {
  const scores = [...benchmark.scores].sort((a, b) => a.at.localeCompare(b.at));
  if (scores.length === 0) return null;

  const steps = frontier(benchmark);
  const h = height;

  /*
   * The axis runs a little past the newest result so the leader is not pinned
   * to the right edge — and so the chart visibly has room for whatever is
   * evaluated next. Derived from the data rather than from the clock: a
   * component that reads the time renders differently on every call.
   */
  const first = Date.parse(scores[0].at);
  const newest = Date.parse(scores[scores.length - 1].at);
  const last = newest + (newest - first) * 0.04;

  const x = (iso: string) =>
    PAD.left + ((Date.parse(iso) - first) / (last - first)) * (W - PAD.left - PAD.right);
  const y = (score: number) =>
    h - PAD.bottom - (score / benchmark.ceiling) * (h - PAD.top - PAD.bottom);

  const years: { y: number; x: number }[] = [];
  for (let yr = new Date(first).getUTCFullYear(); yr <= new Date(last).getUTCFullYear(); yr++) {
    const at = Date.UTC(yr, 0, 1);
    if (at >= first && at <= last) years.push({ y: yr, x: x(new Date(at).toISOString()) });
  }

  const step = steps
    .map((s, i) => {
      const px = x(s.at);
      const py = y(s.score);
      const prev = steps[i - 1];
      return prev
        ? `L${px.toFixed(1)},${y(prev.score).toFixed(1)} L${px.toFixed(1)},${py.toFixed(1)}`
        : `M${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
  const top = steps[steps.length - 1];
  const tail = top ? ` L${(W - PAD.right).toFixed(1)},${y(top.score).toFixed(1)}` : "";

  const grid = [0.25, 0.5, 0.75, 1].map((f) => f * benchmark.ceiling);

  return (
    <div className="-mx-[var(--margin)] overflow-x-auto px-[var(--margin)] sm:mx-0 sm:px-0">
      <svg
        viewBox={`0 0 ${W} ${h}`}
        className="h-auto w-full min-w-[860px]"
        role="img"
        aria-label={`${benchmark.name}: ${scores.length} models scored between ${scores[0].at} and ${scores[scores.length - 1].at}. Best so far ${(top ? top.score * 100 : 0).toFixed(1)} percent, by ${top?.model}.`}
      >
        {/* Anything a coin could score. Shaded, not plotted. */}
        {benchmark.baseline > 0 && (
          <>
            <rect
              x={PAD.left}
              y={y(benchmark.baseline)}
              width={W - PAD.left - PAD.right}
              height={h - PAD.bottom - y(benchmark.baseline)}
              fill="rgba(43,39,33,0.05)"
            />
            <text
              x={PAD.left + 10}
              y={y(benchmark.baseline) - 8}
              className="fill-[var(--faint)] font-meta"
              fontSize="13"
              letterSpacing="0.06em"
            >
              {`Guessing scores ${Math.round(benchmark.baseline * 100)}%`}
            </text>
          </>
        )}

        {grid.map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(g)}
              y2={y(g)}
              stroke={g >= benchmark.ceiling ? "var(--rule-strong)" : "var(--rule)"}
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={y(g) + 4}
              textAnchor="end"
              className="fill-[var(--faint)] font-meta figures"
              fontSize="13"
            >
              {Math.round((g / benchmark.ceiling) * 100)}%
            </text>
          </g>
        ))}

        {years.map((yr) => (
          <g key={yr.y}>
            <line
              x1={yr.x}
              x2={yr.x}
              y1={PAD.top}
              y2={h - PAD.bottom}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
            <text
              x={yr.x}
              y={h - PAD.bottom + 24}
              textAnchor="middle"
              className="fill-[var(--muted)] font-meta"
              fontSize="14"
              fontWeight="600"
              letterSpacing="0.14em"
            >
              {yr.y}
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={h - PAD.bottom}
          y2={h - PAD.bottom}
          stroke="var(--ink)"
          strokeWidth="2"
        />

        {scores.map((s) => (
          <circle
            key={`${s.model}-${s.at}`}
            cx={x(s.at)}
            cy={y(s.score)}
            r="4"
            fill="var(--series-3)"
            fillOpacity="0.38"
          >
            <title>{`${s.model} · ${s.org} · ${(s.score * 100).toFixed(1)}%`}</title>
          </circle>
        ))}

        <path d={step + tail} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />

        {steps.map((s, i) => {
          // Only label the steps that moved the record appreciably, or the
          // line disappears under its own captions.
          const gain = i === 0 ? 1 : s.score - steps[i - 1].score;
          const worth = i === steps.length - 1 || gain >= 0.06;
          /* A label near the right edge is set to the left of its dot; the
             last step is always the record holder, so it is always the one
             that would otherwise run off the sheet. */
          const nearEdge = x(s.at) > W * 0.78;
          return (
            <g key={`step-${s.model}-${s.at}`}>
              <circle
                cx={x(s.at)}
                cy={y(s.score)}
                r="5.5"
                fill="var(--paper)"
                stroke="var(--ink)"
                strokeWidth="2"
              />
              {worth && (
                <text
                  x={x(s.at) + (nearEdge ? -11 : 11)}
                  y={y(s.score) - 11}
                  textAnchor={nearEdge ? "end" : "start"}
                  className="fill-[var(--ink)] font-meta"
                  fontSize="14"
                  fontWeight="600"
                >
                  {s.model}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
