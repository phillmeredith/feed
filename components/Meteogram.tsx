"use client";

import { useId, useState } from "react";
/**
 * The minimum an hour needs to be drawn.
 *
 * Both the home forecast and the six comparison places satisfy this without
 * either having to know about the other — the chart asks for what it plots
 * and nothing more.
 */
export interface ChartHour {
  at: string;
  time: string;
  tempC: number;
  feelsLike: number;
  precipChance: number;
  precipMm: number;
  windKph: number;
  gustKph: number;
  day: boolean;
}

/**
 * The next day and a half, drawn properly.
 *
 * What was here before was twelve one-pixel bars whose height came from
 * `20 + ((t - floor) / span) * 44`. Because the baseline wasn't zero, a day
 * running 16° to 19° drew bars from 20px to 64px — a threefold difference on
 * the page for three degrees in the air. There was no line, so the shape of
 * the day, which is the only reason to look at an hourly forecast, wasn't
 * there to read at all.
 *
 * This is a meteogram: temperature as a line with apparent temperature
 * shadowing it, rain probability as an area beneath, night shaded, and now
 * marked. Scrubbing it reads out any hour.
 */
const W = 1000;
const H = 260;
const PAD = { top: 26, right: 16, bottom: 40, left: 34 };
const PLOT = {
  w: W - PAD.left - PAD.right,
  h: H - PAD.top - PAD.bottom,
};

/** Rain occupies the bottom band; temperature has the rest. */
const RAIN_BAND = 0.42;

export interface Series {
  name: string;
  note?: string;
  hours: ChartHour[];
}

/**
 * When more than one series is passed, the chart gains a row of places and
 * redraws for whichever is chosen.
 *
 * This is the one interaction on the page that a static version genuinely
 * cannot do: the coast and the Tyne valley are half an hour apart and can
 * have different afternoons, and switching between them in place — same axes,
 * same scale, same hour under the cursor — shows the difference in a way six
 * separate charts never would.
 */
export function Meteogram({
  hours,
  series,
}: {
  hours: ChartHour[];
  series?: Series[];
}) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);
  const [place, setPlace] = useState(0);

  const options = series && series.length > 1 ? series : null;
  const drawn = options ? options[place].hours : hours;

  if (drawn.length < 2) return null;

  const temps = drawn.flatMap((h) => [h.tempC, h.feelsLike]);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  // A flat day still deserves a readable line rather than a straight edge.
  const lo = Math.floor(min - 1);
  const hi = Math.ceil(max + 1);
  const span = Math.max(1, hi - lo);

  const x = (i: number) => PAD.left + (i / (drawn.length - 1)) * PLOT.w;
  const tempY = (t: number) =>
    PAD.top + (1 - (t - lo) / span) * (PLOT.h * (1 - RAIN_BAND));
  const rainY = (p: number) =>
    PAD.top + PLOT.h - (p / 100) * (PLOT.h * RAIN_BAND);

  const line = (get: (h: ChartHour) => number) =>
    drawn.map((h, i) => `${i === 0 ? "M" : "L"}${x(i)} ${tempY(get(h))}`).join(" ");

  const rainArea =
    drawn.map((h, i) => `${i === 0 ? "M" : "L"}${x(i)} ${rainY(h.precipChance)}`).join(" ") +
    ` L${x(drawn.length - 1)} ${PAD.top + PLOT.h} L${x(0)} ${PAD.top + PLOT.h} Z`;

  // Night runs as bands behind everything, so the shape of the day is legible.
  const nights: { from: number; to: number }[] = [];
  drawn.forEach((h, i) => {
    if (h.day) return;
    const last = nights[nights.length - 1];
    if (last && last.to === i - 1) last.to = i;
    else nights.push({ from: i, to: i });
  });

  const shown = active ?? 0;
  const point = drawn[shown];

  return (
    <figure className="mt-6">
      {options && (
        <div
          role="group"
          aria-label="Choose a place"
          className="mb-5 flex flex-wrap gap-x-6 gap-y-2"
        >
          {options.map((option, i) => (
            <button
              key={option.name}
              type="button"
              onClick={() => setPlace(i)}
              aria-pressed={i === place}
              className={`kicker text-[10px] pb-1 border-b transition-colors ${
                i === place
                  ? "text-accent border-accent"
                  : "text-muted border-transparent hover:text-accent"
              }`}
            >
              {option.name}
              {/* The state is a colour and a rule, so it is also a word. */}
              <span className="sr-only">{i === place ? " (showing)" : ""}</span>
            </button>
          ))}
        </div>
      )}

      {/*
        * A slider, not an image.
        *
        * This was role="img" with pointer handlers, which meant the one real
        * interaction on the page was unreachable without a mouse. It is a
        * one-dimensional value picker over the hours, which is what a slider
        * is, and arrow keys move it.
        */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        tabIndex={0}
        role="slider"
        aria-label={`Hourly forecast for ${options ? options[place].name : "here"}, next ${drawn.length} hours`}
        aria-valuemin={0}
        aria-valuemax={drawn.length - 1}
        aria-valuenow={shown}
        aria-valuetext={`${point.time}: ${point.tempC} degrees, feels like ${point.feelsLike}, ${point.precipChance} percent chance of rain, wind ${point.windKph} gusting ${point.gustKph} kilometres per hour`}
        onKeyDown={(event) => {
          const step =
            event.key === "ArrowRight" ? 1
            : event.key === "ArrowLeft" ? -1
            : event.key === "PageUp" ? 6
            : event.key === "PageDown" ? -6
            : 0;
          if (step === 0 && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          /* Functional update: a held arrow key fires faster than React
             re-renders, and reading `active` from this closure would make
             every repeat move from the same starting point. */
          setActive((current) =>
            event.key === "Home" ? 0
            : event.key === "End" ? drawn.length - 1
            : Math.min(drawn.length - 1, Math.max(0, (current ?? 0) + step))
          );
        }}
        onBlur={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          const i = Math.round(
            ((ratio * W - PAD.left) / PLOT.w) * (hours.length - 1)
          );
          setActive(Math.min(hours.length - 1, Math.max(0, i)));
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {nights.map((band) => (
          <rect
            key={band.from}
            x={x(band.from)}
            y={PAD.top - 12}
            width={Math.max(1, x(band.to) - x(band.from))}
            height={PLOT.h + 12}
            fill="var(--paper)"
            opacity={0.035}
          />
        ))}

        {/* Temperature gridlines, labelled in whole degrees. */}
        {[lo, Math.round((lo + hi) / 2), hi].map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              y1={tempY(t)}
              x2={W - PAD.right}
              y2={tempY(t)}
              stroke="var(--rule)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={tempY(t) + 4}
              textAnchor="end"
              className="fill-[var(--faint)]"
              fontSize="13"
            >
              {t}°
            </text>
          </g>
        ))}

        <path d={rainArea} fill={`url(#${gradientId})`} />
        <path
          d={drawn.map((h, i) => `${i === 0 ? "M" : "L"}${x(i)} ${rainY(h.precipChance)}`).join(" ")}
          stroke="var(--accent)"
          strokeOpacity={0.5}
          strokeWidth={1.5}
          fill="none"
        />

        {/* Apparent temperature shadows the real one; where they part, the
            wind is doing something worth knowing about. */}
        <path
          d={line((h) => h.feelsLike)}
          stroke="var(--muted)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
        />
        <path
          d={line((h) => h.tempC)}
          stroke="var(--accent)"
          strokeWidth={2.5}
          fill="none"
        />

        {/* Now. */}
        <line
          x1={x(0)}
          y1={PAD.top - 14}
          x2={x(0)}
          y2={PAD.top + PLOT.h}
          stroke="var(--paper)"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        <text
          x={x(0) + 6}
          y={PAD.top - 16}
          className="fill-[var(--faint)]"
          fontSize="12"
          letterSpacing="1.4"
        >
          NOW
        </text>

        {/* Hour axis, every three hours so it stays readable on a phone. */}
        {drawn.map((h, i) =>
          i % 3 === 0 ? (
            <text
              key={h.at}
              x={x(i)}
              y={H - 18}
              textAnchor="middle"
              className="fill-[var(--faint)]"
              fontSize="13"
            >
              {h.time.slice(0, 2)}
            </text>
          ) : null
        )}

        {active !== null && (
          <g>
            <line
              x1={x(active)}
              y1={PAD.top - 14}
              x2={x(active)}
              y2={PAD.top + PLOT.h}
              stroke="var(--accent)"
              strokeWidth={1}
            />
            <circle
              cx={x(active)}
              cy={tempY(point.tempC)}
              r={4.5}
              fill="var(--accent)"
            />
          </g>
        )}
      </svg>

      {/*
       * The readout. It shows the first hour until the chart is touched, so
       * the figure says something useful before anyone interacts with it.
       */}
      {/* Named, so nothing here depends on telling two colours apart. */}
      <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-2 kicker text-[9px] text-faint">
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="22" y2="4" stroke="var(--accent)" strokeWidth="2.5" />
          </svg>
          Temperature
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="22" y2="4" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          Feels like
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <rect x="0" y="1" width="22" height="6" fill="var(--accent)" fillOpacity="0.25" />
          </svg>
          Chance of rain
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <rect x="0" y="0" width="22" height="8" fill="var(--paper)" fillOpacity="0.06" />
          </svg>
          Night
        </li>
      </ul>

      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-rule pt-3">
        <span className="kicker text-[10px] text-accent w-14">
          {active === null ? "Now" : point.time}
        </span>
        <Reading label="Temp" value={`${point.tempC}°`} />
        <Reading label="Feels" value={`${point.feelsLike}°`} />
        <Reading label="Rain" value={`${point.precipChance}%`} />
        {point.precipMm > 0 && (
          <Reading label="Fall" value={`${point.precipMm.toFixed(1)} mm`} />
        )}
        <Reading label="Wind" value={`${point.windKph} km/h`} />
        {point.gustKph > point.windKph + 5 && (
          <Reading label="Gusting" value={`${point.gustKph} km/h`} />
        )}
        <span className="kicker text-[9px] text-faint ml-auto hidden sm:inline">
          Drag across, or focus and use ← →
        </span>
      </figcaption>
    </figure>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="kicker text-[9px] text-faint">{label}</span>
      <span className="font-body text-[15px] tabular-nums">{value}</span>
    </span>
  );
}
