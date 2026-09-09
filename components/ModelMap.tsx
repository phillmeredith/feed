import { labKey, type ModelHistory, type MapPoint } from "@/lib/modelmap";

/*
 * Three years of model releases on one sheet.
 *
 * Time across, context window up, one dot per model — and a stepped line
 * through the models that could hold more than anything before them, which is
 * the only line in this history most people already half-remember.
 *
 * The vertical scale is logarithmic and has to be: the catalogue runs from
 * four thousand tokens to two million, and drawn linearly every model before
 * 2024 sits on the floor in a heap. What a log scale costs is that equal
 * heights are equal multiples rather than equal amounts, so the gridlines are
 * labelled with what the number means — a report, a book, a shelf — instead of
 * leaving a reader to do powers of ten in their head.
 *
 * Rendered on the server as plain SVG. There is no chart library here and no
 * script: it is a picture of a table, and it prints.
 */

const W = 1600;
const H = 560;
/* The left margin holds "1M · a shelf of them", not "1M". */
const PAD = { top: 34, right: 30, bottom: 46, left: 200 };

const MIN_CTX = 4_000;
const MAX_CTX = 2_400_000;

const INKS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
];

/** Gridlines a reader can picture, rather than round numbers of tokens. */
const RUNGS = [
  { tokens: 8_000, as: "8K · an essay" },
  { tokens: 32_000, as: "32K · a long report" },
  { tokens: 128_000, as: "128K · a short book" },
  { tokens: 1_000_000, as: "1M · a shelf of them" },
  { tokens: 2_000_000, as: "2M" },
];

function scaleY(tokens: number) {
  const lo = Math.log10(MIN_CTX);
  const hi = Math.log10(MAX_CTX);
  const t = (Math.log10(Math.max(tokens, MIN_CTX)) - lo) / (hi - lo);
  return H - PAD.bottom - t * (H - PAD.top - PAD.bottom);
}

export function ModelMap({ history }: { history: ModelHistory }) {
  const { points, labs, frontier, span } = history;
  if (points.length === 0) return null;

  const first = Date.parse(span.from);
  /*
   * The axis runs to the end of the current quarter rather than to the last
   * model in the catalogue, so the newest release has somewhere to sit rather
   * than being pinned to the right edge — and so the map visibly has room for
   * what has not shipped yet.
   */
  const now = new Date();
  const endOfQuarter = Date.UTC(
    now.getUTCFullYear(),
    (Math.floor(now.getUTCMonth() / 3) + 1) * 3,
    1
  );
  const last = Math.max(Date.parse(span.to), endOfQuarter);
  const scaleX = (iso: string) => {
    const t = (Date.parse(iso) - first) / (last - first);
    return PAD.left + t * (W - PAD.left - PAD.right);
  };

  const inkFor = new Map(labs.map((l, i) => [l.key, INKS[i]]));
  const ink = (lab: string) => inkFor.get(labKey(lab)) ?? "var(--settled)";

  const years = [];
  for (let y = new Date(first).getUTCFullYear(); y <= new Date(last).getUTCFullYear(); y++) {
    const at = Date.UTC(y, 0, 1);
    if (at >= first && at <= last) years.push({ y, x: scaleX(new Date(at).toISOString()) });
  }

  // A step line: hold the old ceiling until the day something beat it.
  const steps = frontier
    .map((p, i) => {
      const x = scaleX(p.at);
      const y = scaleY(p.context);
      const prev = frontier[i - 1];
      return prev ? `L${x.toFixed(1)},${scaleY(prev.context).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastStep = frontier[frontier.length - 1];
  const tail = lastStep
    ? ` L${(W - PAD.right).toFixed(1)},${scaleY(lastStep.context).toFixed(1)}`
    : "";

  return (
    <figure className="mt-8">
      {/*
        * Scrolls sideways on a narrow screen rather than shrinking.
        *
        * The viewBox is 1600 units across; squeezed into a 375px phone that
        * makes the axis labels three pixels tall. Three years of releases is
        * a wide thing and stays wide — the reader moves along it, which is
        * what the site already does with a table too wide to fit.
        */}
      <div className="-mx-[var(--margin)] overflow-x-auto px-[var(--margin)] sm:mx-0 sm:px-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[880px]"
        role="img"
        aria-label={`Every model in the catalogue by release date and context window: ${points.length} models from ${span.from.slice(0, 10)} to ${span.to.slice(0, 10)}, the largest holding ${Math.round((lastStep?.context ?? 0) / 1000)} thousand tokens.`}
      >
        {/* The rungs, and what each one is the size of. */}
        {RUNGS.map((rung) => {
          const y = scaleY(rung.tokens);
          return (
            <g key={rung.tokens}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--rule)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-[var(--faint)] font-meta"
                fontSize="13"
                letterSpacing="0.06em"
              >
                {rung.as}
              </text>
            </g>
          );
        })}

        {/* Years, marked on the floor. */}
        {years.map((year) => (
          <g key={year.y}>
            <line
              x1={year.x}
              x2={year.x}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
            <text
              x={year.x}
              y={H - PAD.bottom + 24}
              textAnchor="middle"
              className="fill-[var(--muted)] font-meta"
              fontSize="14"
              fontWeight="600"
              letterSpacing="0.14em"
            >
              {year.y}
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="var(--ink)"
          strokeWidth="2"
        />

        {/* Every model. Drawn before the frontier so the line sits on top. */}
        {points.map((p) => (
          <circle
            key={p.id}
            cx={scaleX(p.at)}
            cy={scaleY(p.context)}
            r={p.multimodal ? 5 : 3.4}
            fill={ink(p.lab)}
            fillOpacity={p.multimodal ? 0.62 : 0.42}
          >
            <title>
              {`${p.name} · ${p.lab} · ${new Date(p.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${Math.round(p.context / 1000)}K tokens`}
            </title>
          </circle>
        ))}

        {/* The ceiling, and the model that raised it. */}
        <path
          d={steps + tail}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {frontier.map((p) => {
          const nearEdge = scaleX(p.at) > W * 0.78;
          return (
          <g key={`step-${p.id}`}>
            <circle
              cx={scaleX(p.at)}
              cy={scaleY(p.context)}
              r="5.5"
              fill="var(--paper)"
              stroke="var(--ink)"
              strokeWidth="2"
            />
            <text
              x={scaleX(p.at) + (nearEdge ? -11 : 11)}
              y={scaleY(p.context) - 11}
              textAnchor={nearEdge ? "end" : "start"}
              className="fill-[var(--ink)] font-meta"
              fontSize="14"
              fontWeight="600"
            >
              {p.name}
            </text>
          </g>
          );
        })}
      </svg>
      </div>

      <figcaption className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="uppercase tracking-[0.11em] text-micro font-semibold text-muted">
          {points.length} models
        </span>
        {labs.map((lab, i) => (
          <span key={lab.key} className="inline-flex items-baseline gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-[9px] w-[9px] rounded-full"
              style={{ background: INKS[i] }}
            />
            {lab.label} <span className="text-faint">{lab.count}</span>
          </span>
        ))}
        <span className="inline-flex items-baseline gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-[9px] w-[9px] rounded-full"
            style={{ background: "var(--settled)" }}
          />
          Everyone else
        </span>
        <span className="text-faint">
          A larger dot takes more than text. The line is the largest context
          window anyone had shipped.
        </span>
      </figcaption>
    </figure>
  );
}

export type { MapPoint };
