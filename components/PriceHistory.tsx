import type { Observation } from "@/lib/series";
import { movement } from "@/lib/series";

function Sparkline({ points, label }: { points: Observation[]; label: string }) {
  const width = 320;
  const height = 64;
  const pad = 6;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const path = points
    .map((p, i) => {
      const x = pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2);
      const y = height - pad - ((p.value - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = points[points.length - 1];
  const lastX = width - pad;
  const lastY =
    height - pad - ((last.value - min) / span) * (height - pad * 2);

  return (
    <div>
      <p className="kicker text-[9px] text-faint">{label}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-16 mt-2"
        role="img"
        aria-label={`${label}: ${points.length} observations, latest $${last.value}`}
      >
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        <circle cx={lastX} cy={lastY} r="2.5" fill="var(--accent)" />
      </svg>
    </div>
  );
}

/**
 * Price over time — and, for now, mostly an honest account of not having any.
 *
 * The series began the day the recorder was switched on, so almost every model
 * here has a single observation. Drawing a flat line through one point would
 * imply a stability nobody has measured; saying what is actually known is more
 * use, and the panel turns into a chart on its own once a second reading lands.
 */
export function PriceHistory({
  input,
  output,
  since,
}: {
  input: Observation[];
  output: Observation[];
  since?: string;
}) {
  const enough = input.length >= 2 || output.length >= 2;
  const started = since
    ? new Date(since).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (!enough) {
    return (
      <section className="mt-12 border-t border-rule pt-6">
        <h2 className="kicker text-[11px] text-accent">Price history</h2>
        <p className="font-serif italic text-lg text-muted mt-3 max-w-2xl">
          {started
            ? `Recording since ${started}. Nobody sells price history back to you, so this chart fills in from here — one reading a day.`
            : "Not yet recorded for this model."}
        </p>
      </section>
    );
  }

  const inMove = movement(input);
  const outMove = movement(output);

  return (
    <section className="mt-12 border-t border-rule pt-6">
      <h2 className="kicker text-[11px] text-accent">Price history</h2>
      <p className="text-[13px] text-muted mt-2">
        {input.length} readings{started && ` since ${started}`}
        {inMove && inMove.changePct !== 0 && (
          <>
            {" · input "}
            <span className={inMove.changePct > 0 ? "text-negative" : "text-accent"}>
              {inMove.changePct > 0 ? "▲" : "▼"}
              {Math.abs(inMove.changePct).toFixed(1)}%
            </span>
          </>
        )}
        {outMove && outMove.changePct !== 0 && (
          <>
            {" · output "}
            <span className={outMove.changePct > 0 ? "text-negative" : "text-accent"}>
              {outMove.changePct > 0 ? "▲" : "▼"}
              {Math.abs(outMove.changePct).toFixed(1)}%
            </span>
          </>
        )}
      </p>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 max-w-3xl">
        {input.length >= 2 && <Sparkline points={input} label="Input $/Mtok" />}
        {output.length >= 2 && <Sparkline points={output} label="Output $/Mtok" />}
      </div>
    </section>
  );
}
