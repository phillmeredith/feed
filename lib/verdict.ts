import type { DetailedWeather, HourPoint } from "./weather";
import { HOUSEHOLD, windVerdict } from "./household";

/**
 * The answers, rather than the instruments.
 *
 * A forecast page can show temperature, pressure, gusts and cloud and still
 * leave a reader to work out the only things they came for: when to go out,
 * whether it's too windy, whether tonight is worth a telescope. Those are
 * derivable from the numbers already fetched, and stating them is the
 * difference between a dashboard and a page that is any use.
 *
 * Every threshold here is written down and explained rather than tuned by
 * feel, so a verdict that reads wrong can be argued with.
 */

/** Beaufort, which is what "windy" has meant for two centuries. */
export const GUST_BANDS = [
  { from: 0, label: "Calm", note: "barely moving" },
  { from: 20, label: "Breezy", note: "leaves and small branches" },
  { from: 39, label: "Windy", note: "hard to walk against in gusts" },
  { from: 50, label: "Very windy", note: "umbrellas turn inside out" },
  { from: 62, label: "Gale", note: "twigs down, walking is work" },
  { from: 75, label: "Severe gale", note: "stay off exposed ground" },
  { from: 89, label: "Storm", note: "structural damage possible" },
];

export function gustBand(gustKph: number) {
  return [...GUST_BANDS].reverse().find((b) => gustKph >= b.from) ?? GUST_BANDS[0];
}

export interface Window {
  from: string;
  to: string;
  /** Why this window won, in the terms it was scored on. */
  detail: string;
}

export interface Verdict {
  /** One sentence answering "what's it doing". */
  headline: string;
  outdoors: Window | null;
  /** The worst of the day, so it can be avoided rather than discovered. */
  avoid: Window | null;
  wind: {
    peakGust: number;
    band: (typeof GUST_BANDS)[number];
    /** The same gust, judged against this household's threshold. */
    verdict: ReturnType<typeof windVerdict>;
    /** When the wind is at its worst, if that's a distinct part of the day. */
    peakAt: string | null;
  };
  stars: {
    verdict: "good" | "fair" | "poor";
    /** Mean cloud cover across the darkest hours. */
    cloud: number;
    detail: string;
  };
  /** Take a coat, take an umbrella, or neither. */
  carry: string;
}

/**
 * How pleasant an hour is to be outside in, 0–100.
 *
 * Rain dominates because it ends an outing on its own; wind comes next
 * because it makes cold worse and light rain intolerable; temperature is a
 * gentle preference around 17°C rather than a hard rule, since this is the
 * north east and waiting for 22° means never going out.
 */
function comfort(hour: HourPoint): number {
  const rain = hour.precipChance * 0.6 + Math.min(40, hour.precipMm * 40);
  const wind = Math.max(0, hour.gustKph - 20) * 0.9;
  const chill = Math.abs(hour.feelsLike - 17) * 1.6;
  return Math.max(0, 100 - rain - wind - chill);
}

/** Consecutive daylight hours, scored together, best run wins. */
function bestRun(
  hours: HourPoint[],
  score: (h: HourPoint) => number,
  length: number
): { start: number; mean: number } | null {
  if (hours.length < length) return null;
  let best: { start: number; mean: number } | null = null;
  for (let i = 0; i + length <= hours.length; i += 1) {
    const slice = hours.slice(i, i + length);
    const mean = slice.reduce((sum, h) => sum + score(h), 0) / length;
    if (!best || mean > best.mean) best = { start: i, mean };
  }
  return best;
}

function hourLabel(hour: HourPoint) {
  return hour.time.slice(0, 5);
}

export function readVerdict(weather: DetailedWeather): Verdict {
  const hours = weather.hours;
  // Today means the rest of today: there is no use recommending this morning.
  const todayHours = hours.slice(0, 18);
  const daylight = todayHours.filter((h) => h.day);

  const outdoorRun = bestRun(daylight, comfort, Math.min(3, daylight.length));
  const outdoors =
    outdoorRun && daylight.length >= 2
      ? {
          from: hourLabel(daylight[outdoorRun.start]),
          to: hourLabel(
            daylight[Math.min(daylight.length - 1, outdoorRun.start + 2)]
          ),
          detail: describeRun(
            daylight.slice(outdoorRun.start, outdoorRun.start + 3)
          ),
        }
      : null;

  const worstRun = bestRun(daylight, (h) => -comfort(h), Math.min(2, daylight.length));
  const worst = worstRun ? daylight.slice(worstRun.start, worstRun.start + 2) : [];
  const avoid =
    worst.length >= 2 && outdoorRun && worstRun && worstRun.mean < -20
      ? {
          from: hourLabel(worst[0]),
          to: hourLabel(worst[worst.length - 1]),
          detail: describeRun(worst),
        }
      : null;

  const peakGust = Math.max(...todayHours.map((h) => h.gustKph));
  const peakHour = todayHours.find((h) => h.gustKph === peakGust);

  /*
   * Stargazing is judged on the astronomical night, not the evening: cloud at
   * eight o'clock says little about cloud at midnight, and the sky is only
   * properly dark well after sunset.
   */
  const night = hours.filter((h) => !h.day).slice(0, 8);
  const nightCloud = night.length
    ? Math.round(night.reduce((sum, h) => sum + h.cloud, 0) / night.length)
    : 100;
  const clearest = night.length
    ? night.reduce((a, b) => (b.cloud < a.cloud ? b : a))
    : null;

  const stars = {
    verdict:
      nightCloud <= HOUSEHOLD.stars.good ? ("good" as const)
      : nightCloud <= HOUSEHOLD.stars.fair ? ("fair" as const)
      : ("poor" as const),
    cloud: nightCloud,
    detail:
      nightCloud <= HOUSEHOLD.stars.good
        ? `Mostly clear overnight — ${nightCloud}% cloud`
        : nightCloud <= HOUSEHOLD.stars.fair
          ? clearest
            ? `Breaking cloud; clearest around ${hourLabel(clearest)} at ${clearest.cloud}%`
            : `Broken cloud overnight`
          : `Overcast overnight — ${nightCloud}% cloud`,
  };

  const wettest = Math.max(...todayHours.map((h) => h.precipChance));
  const carry =
    wettest >= 60 && peakGust >= HOUSEHOLD.wind.noticeable
      ? "Coat, not an umbrella — it'll be turned inside out"
      : wettest >= 60
        ? "Umbrella"
        : wettest >= 30
          ? "Something waterproof, just in case"
          : peakGust >= HOUSEHOLD.wind.noticeable
            ? "Something windproof"
            : "Nothing much";

  return {
    headline: headlineFor(weather, peakGust, wettest),
    outdoors,
    avoid,
    wind: {
      peakGust,
      band: gustBand(peakGust),
      verdict: windVerdict(peakGust),
      peakAt: peakHour ? hourLabel(peakHour) : null,
    },
    stars,
    carry,
  };
}

function describeRun(run: HourPoint[]) {
  const rain = Math.round(
    run.reduce((sum, h) => sum + h.precipChance, 0) / run.length
  );
  const gust = Math.max(...run.map((h) => h.gustKph));
  const temp = Math.round(
    run.reduce((sum, h) => sum + h.feelsLike, 0) / run.length
  );
  return `feels ${temp}°, ${rain}% rain, gusts to ${gust} km/h`;
}

function headlineFor(
  weather: DetailedWeather,
  peakGust: number,
  wettest: number
) {
  const band = gustBand(peakGust);
  const parts: string[] = [weather.condition.toLowerCase()];
  if (wettest >= 60) parts.push("rain likely");
  else if (wettest >= 30) parts.push("showers possible");
  if (peakGust >= HOUSEHOLD.wind.noticeable)
    parts.push(`${band.label.toLowerCase()}, gusting ${peakGust}`);
  return parts.join(", ");
}
