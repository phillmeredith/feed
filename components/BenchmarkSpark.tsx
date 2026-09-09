import { frontier, modelName, type Benchmark } from "@/lib/benchmarks";

/*
 * The same history as the big chart, at a twelfth of the size.
 *
 * Not the same drawing shrunk, which is what it was and why it did not work.
 * Three hundred dots and eight captions are legible across a page; across a
 * card four inches wide they are a grey smear with type on top, and eleven of
 * those in a grid is a page of static.
 *
 * So the cloud goes and the staircase stays. The line is the finding — where
 * the record actually moved — and at this size it is the only thing that can
 * be read, so it is the only thing drawn. The cloud is still there in the
 * headline chart above, once, at a size that can carry it.
 *
 * The viewBox is small on purpose. Text in an SVG scales with the box, so a
 * 1600-unit chart squeezed into a column renders its labels at three pixels;
 * at 640 units across, the same labels come out legible.
 */

const W = 640;
const H = 190;
const PAD = { top: 16, right: 14, bottom: 24, left: 40 };

export function BenchmarkSpark({ benchmark }: { benchmark: Benchmark }) {
  const steps = frontier(benchmark);
  if (steps.length === 0) return null;

  const scores = [...benchmark.scores].sort((a, b) => a.at.localeCompare(b.at));
  const first = Date.parse(scores[0].at);
  const newest = Date.parse(scores[scores.length - 1].at);
  const span = newest - first || 1;

  const x = (iso: string) =>
    PAD.left + ((Date.parse(iso) - first) / span) * (W - PAD.left - PAD.right);
  const y = (score: number) =>
    H - PAD.bottom - (score / benchmark.ceiling) * (H - PAD.top - PAD.bottom);

  const path = steps
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
  const full = `${path} L${(W - PAD.right).toFixed(1)},${y(top.score).toFixed(1)}`;

  // Filled beneath, so a glance reads the area rather than hunting the line.
  const area = `${full} L${(W - PAD.right).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${x(steps[0].at).toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`;

  const startYear = new Date(first).getUTCFullYear();
  const endYear = new Date(newest).getUTCFullYear();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 h-auto w-full"
      role="img"
      aria-label={`${benchmark.name}: the record rose from ${Math.round(steps[0].score * 100)} percent in ${startYear} to ${Math.round(top.score * 100)} percent, held by ${modelName(top.model).name}.`}
    >
      {benchmark.baseline > 0 && (
        <rect
          x={PAD.left}
          y={y(benchmark.baseline)}
          width={W - PAD.left - PAD.right}
          height={H - PAD.bottom - y(benchmark.baseline)}
          fill="rgba(43,39,33,0.06)"
        />
      )}

      {[0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(f * benchmark.ceiling)}
            y2={y(f * benchmark.ceiling)}
            stroke={f === 1 ? "var(--rule-strong)" : "var(--rule)"}
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={y(f * benchmark.ceiling) + 5}
            textAnchor="end"
            className="fill-[var(--faint)] font-meta figures"
            fontSize="14"
          >
            {Math.round(f * 100)}%
          </text>
        </g>
      ))}

      <path d={area} fill="var(--series-3)" fillOpacity="0.14" />
      <path d={full} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />

      <circle cx={x(top.at)} cy={y(top.score)} r="4.5" fill="var(--accent)" />

      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      <text
        x={PAD.left}
        y={H - PAD.bottom + 17}
        className="fill-[var(--faint)] font-meta"
        fontSize="14"
        letterSpacing="0.1em"
      >
        {startYear}
      </text>
      <text
        x={W - PAD.right}
        y={H - PAD.bottom + 17}
        textAnchor="end"
        className="fill-[var(--faint)] font-meta"
        fontSize="14"
        letterSpacing="0.1em"
      >
        {endYear}
      </text>
    </svg>
  );
}
