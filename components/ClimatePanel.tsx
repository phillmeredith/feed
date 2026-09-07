import { climateIndicators, ensoPhase, type Indicator } from "@/lib/climate";

/**
 * Where the climate actually stands, above the reporting about it.
 *
 * This desk ran a forecast and then a list of headlines, which tells a reader
 * what was published this week and nothing about the system being written
 * about. These are the three measurements that the reporting is mostly a
 * commentary on, from the agencies that make them.
 *
 * The sparklines are deliberately unlabelled: at this size an axis is noise,
 * and the number beside them carries the value. They exist to show direction,
 * which in all three cases is the point.
 */
export function ClimatePanel() {
  const indicators = climateIndicators();
  if (indicators.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
        <h2 className="kicker text-label text-accent">The state of the system</h2>
        <p className="font-serif italic text-xs text-faint">
          Measured, not modelled
        </p>
      </div>

      <div className="mt-8 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((indicator) => (
          <Dial key={indicator.key} indicator={indicator} />
        ))}
      </div>
    </section>
  );
}

function Dial({ indicator }: { indicator: Indicator }) {
  const headline =
    indicator.key === "enso"
      ? ensoPhase(indicator.value)
      : indicator.key === "anomaly"
        ? `+${indicator.value.toFixed(2)}°C`
        : `${indicator.value.toFixed(2)}`;

  return (
    <figure>
      <p className="kicker text-micro text-faint">{indicator.label}</p>

      <p className="display text-headline leading-none mt-3">
        {headline}
        {indicator.key === "co2" && (
          <span className="font-serif italic text-lg text-muted ml-2">ppm</span>
        )}
      </p>

      {indicator.key === "enso" && (
        <p className="font-body text-small text-muted mt-2 figures">
          ONI {indicator.value > 0 ? "+" : ""}
          {indicator.value.toFixed(2)} · {indicator.updated}
        </p>
      )}
      {indicator.yearChange !== undefined && (
        <p className="font-body text-small text-muted mt-2 figures">
          {indicator.yearChange >= 0 ? "+" : ""}
          {indicator.yearChange} {indicator.unit} on a year ago
        </p>
      )}

      <Spark indicator={indicator} />

      <figcaption className="mt-4">
        <p className="font-serif text-small leading-relaxed text-muted">
          {indicator.note}
        </p>
        <p className="kicker text-micro text-faint mt-3">
          {indicator.source} · {indicator.updated}
        </p>
      </figcaption>
    </figure>
  );
}

function Spark({ indicator }: { indicator: Indicator }) {
  const points = indicator.history;
  if (points.length < 2) return null;

  const W = 240;
  const H = 54;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(0.0001, hi - lo);

  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - 4 - ((v - lo) / span) * (H - 8);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  /*
   * ENSO is the one indicator that crosses zero and means opposite things
   * either side of it, so it gets the line that says where zero is. On the
   * other two, zero is nowhere near the data and drawing it would flatten
   * the series into a straight edge.
   */
  const zero = indicator.key === "enso" && lo < 0 && hi > 0 ? y(0) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto mt-5 max-w-[260px]"
      role="img"
      aria-label={`${indicator.label}: ${points.length} readings to ${indicator.updated}`}
    >
      {zero !== null && (
        <line
          x1="0"
          y1={zero}
          x2={W}
          y2={zero}
          stroke="var(--rule)"
          strokeWidth={1}
        />
      )}
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
      <circle
        cx={x(points.length - 1)}
        cy={y(values[values.length - 1])}
        r={3}
        fill="var(--accent)"
      />
    </svg>
  );
}
