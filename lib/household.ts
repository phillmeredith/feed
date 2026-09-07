/**
 * The thresholds this page judges by.
 *
 * A verdict like "too windy" is meaningless without a number behind it, and
 * the number that matters is the reader's, not the Admiralty's. Beaufort is a
 * defensible default and nobody's actual threshold.
 *
 * So they live here with the reasoning written down, and every one can be
 * overridden by an environment variable without touching code. A verdict that
 * reads wrong is then a one-line change rather than an argument with a regex.
 */
function tunable(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const HOUSEHOLD = {
  wind: {
    /*
     * Gust speeds, km/h. The defaults are Beaufort 5 and 7 — the points at
     * which small trees sway and walking becomes work — chosen because they
     * are defensible, not because they are right for anyone in particular.
     */
    noticeable: tunable("WEATHER_WIND_NOTICEABLE", 39),
    tooMuch: tunable("WEATHER_WIND_TOO_MUCH", 62),
  },
  stars: {
    /*
     * Mean cloud cover across the astronomical night, percent. Under 25 is a
     * genuinely good night; over 55 there is nothing to see.
     */
    good: tunable("WEATHER_STARS_GOOD", 25),
    fair: tunable("WEATHER_STARS_FAIR", 55),
  },
  travel: {
    /** How far it's worth driving for better weather, kilometres. */
    radiusKm: tunable("WEATHER_TRAVEL_RADIUS_KM", 70),
  },
} as const;

/** The wind verdict against the configured thresholds, not the Admiralty's. */
export function windVerdict(gustKph: number): {
  label: string;
  note: string;
  severity: "fine" | "noticeable" | "too-much";
} {
  const { noticeable, tooMuch } = HOUSEHOLD.wind;
  if (gustKph >= tooMuch) {
    return {
      label: "Too much",
      note: `Gusting past ${tooMuch} — more than anyone will want to be out in`,
      severity: "too-much",
    };
  }
  if (gustKph >= noticeable) {
    return {
      label: "Noticeable",
      note: `Over ${noticeable}, enough to be felt`,
      severity: "noticeable",
    };
  }
  return {
    label: "Fine",
    note: `Under ${noticeable}, nothing to plan around`,
    severity: "fine",
  };
}
