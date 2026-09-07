/**
 * How much the forecast actually knows.
 *
 * A sixteen-day forecast presented as sixteen equally confident numbers is a
 * lie of omission: day fourteen is a guess and day two is not, and the page
 * had no way of saying so. Weather services run the model dozens of times
 * from slightly different starting conditions precisely to measure this, and
 * Open-Meteo serves those ensemble members without a key.
 *
 * The spread between members is the confidence. Where they agree, the
 * forecast is worth planning around; where they fan out to eight degrees,
 * it is worth checking again tomorrow.
 */
export interface DayConfidence {
  date: string;
  /** Degrees between the coolest and warmest member, at that day's peak. */
  spreadC: number;
  level: "high" | "moderate" | "low";
}

/*
 * Thresholds in degrees of ensemble spread. Under 3 the members essentially
 * agree; past 6 they are describing different days.
 */
const HIGH = 3;
const LOW = 6;

export function confidenceLevel(spreadC: number): DayConfidence["level"] {
  if (spreadC <= HIGH) return "high";
  if (spreadC <= LOW) return "moderate";
  return "low";
}

export const CONFIDENCE_LABEL: Record<DayConfidence["level"], string> = {
  high: "Confident",
  moderate: "Less certain",
  low: "A guess",
};

interface EnsembleResponse {
  hourly: Record<string, (number | null)[] | string[]>;
}

/** Daily confidence for as far ahead as the ensemble runs. */
export async function getConfidence(
  latitude: number,
  longitude: number
): Promise<DayConfidence[]> {
  const url =
    `https://ensemble-api.open-meteo.com/v1/ensemble` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=temperature_2m&models=icon_seamless&forecast_days=7&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as EnsembleResponse;

    const times = data.hourly.time as string[];
    const members = Object.keys(data.hourly).filter((k) =>
      k.startsWith("temperature_2m_member")
    );
    if (!times || members.length === 0) return [];

    // Widest disagreement in each day, which is the honest number to show.
    const byDate = new Map<string, number>();
    times.forEach((time, i) => {
      const values = members
        .map((m) => (data.hourly[m] as (number | null)[])[i])
        .filter((v): v is number => typeof v === "number");
      if (values.length < 2) return;

      const spread = Math.max(...values) - Math.min(...values);
      const date = time.slice(0, 10);
      byDate.set(date, Math.max(byDate.get(date) ?? 0, spread));
    });

    return [...byDate.entries()].map(([date, spreadC]) => ({
      date,
      spreadC: Number(spreadC.toFixed(1)),
      level: confidenceLevel(spreadC),
    }));
  } catch {
    return [];
  }
}
