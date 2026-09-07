"use client";

import { useEffect, useState } from "react";

/**
 * Where the sun is, and how much of the day is left.
 *
 * Sunrise and sunset were two numbers in the corner of a stats grid, which is
 * the least useful form that information takes. What anyone actually wants
 * from them is a glance: is it early, is the light going, how long have I got.
 * An arc answers that without being read.
 *
 * It ticks on a minute rather than being rendered once, because a page that
 * sits open all afternoon should not show the sun where it was at breakfast.
 */
export function DaylightArc({
  sunrise,
  sunset,
  sunriseLabel,
  sunsetLabel,
}: {
  sunrise: string;
  sunset: string;
  sunriseLabel: string;
  sunsetLabel: string;
}) {
  // Rendered from the server's clock first, then corrected to the reader's.
  const [now, setNow] = useState(() => Date.parse(sunrise));
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const rise = Date.parse(sunrise);
  const set = Date.parse(sunset);
  if (!Number.isFinite(rise) || !Number.isFinite(set) || set <= rise) return null;

  const progress = Math.min(1, Math.max(0, (now - rise) / (set - rise)));
  const daylightMinutes = Math.round((set - rise) / 60_000);
  const remaining = Math.max(0, Math.round((set - now) / 60_000));

  // A half-circle from sunrise on the left to sunset on the right.
  const W = 220;
  const H = 116;
  const R = 88;
  const cx = W / 2;
  const cy = H - 12;
  const angle = Math.PI * (1 - progress);
  const sx = cx + R * Math.cos(angle);
  const sy = cy - R * Math.sin(angle);

  const before = now < rise;
  const after = now > set;

  return (
    <figure className="lg:border-l lg:border-rule lg:pl-10">
      <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
        Daylight
      </h2>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto mt-6 max-w-[240px]"
        role="img"
        aria-label={`Sunrise ${sunriseLabel}, sunset ${sunsetLabel}`}
      >
        <path
          d={`M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={1.5}
        />
        {/* The part of the day already spent. */}
        <path
          d={`M${cx - R} ${cy} A${R} ${R} 0 0 1 ${sx} ${sy}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeOpacity={0.55}
        />
        <line
          x1={cx - R - 6}
          y1={cy}
          x2={cx + R + 6}
          y2={cy}
          stroke="var(--rule)"
          strokeWidth={1}
        />

        {!before && !after && (
          <>
            <circle cx={sx} cy={sy} r={7} fill="var(--accent)" />
            <circle
              cx={sx}
              cy={sy}
              r={13}
              fill="none"
              stroke="var(--accent)"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          </>
        )}

        <text x={cx - R} y={cy + 16} textAnchor="start" className="fill-[var(--faint)]" fontSize="11" letterSpacing="1.2">
          {sunriseLabel}
        </text>
        <text x={cx + R} y={cy + 16} textAnchor="end" className="fill-[var(--faint)]" fontSize="11" letterSpacing="1.2">
          {sunsetLabel}
        </text>
      </svg>

      <figcaption className="mt-4">
        <p className="font-serif text-lg text-accent">
          {before
            ? "Before sunrise"
            : after
              ? "After sunset"
              : `${hoursAndMinutes(remaining)} of light left`}
        </p>
        <p className="kicker text-[9px] text-faint mt-2">
          {hoursAndMinutes(daylightMinutes)} between sunrise and sunset
        </p>
      </figcaption>
    </figure>
  );
}

function hoursAndMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
