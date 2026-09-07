/**
 * The places worth checking against home.
 *
 * Far enough apart to have genuinely different weather, close enough to be
 * worth driving to on the strength of a forecast. Open-Meteo takes a list of
 * coordinates in one request, so comparing them costs the same as not
 * comparing them.
 */
export interface Place {
  name: string;
  note: string;
  latitude: number;
  longitude: number;
}

export const PLACES: Place[] = [
  { name: "Newcastle", note: "home", latitude: 54.9783, longitude: -1.6178 },
  { name: "Tynemouth", note: "coast", latitude: 55.0174, longitude: -1.4230 },
  { name: "Rothbury", note: "Northumberland", latitude: 55.3106, longitude: -1.9110 },
  { name: "Durham", note: "south", latitude: 54.7761, longitude: -1.5733 },
  { name: "Hexham", note: "Tyne valley", latitude: 54.9709, longitude: -2.1017 },
  { name: "Kielder", note: "dark sky park", latitude: 55.2333, longitude: -2.5833 },
];

export interface PlaceForecast {
  name: string;
  note: string;
  /** Total millimetres over the window. */
  rainMm: number;
  /** The worst hour's probability, which is what spoils an afternoon. */
  peakChance: number;
  gustKph: number;
  cloud: number;
  /** The next twelve hours, so the chart can be redrawn for this place. */
  hours: PlaceHour[];
}

/**
 * The slice of an hour a chart needs, and nothing else.
 *
 * Six places' full hourly forecast is a lot of numbers to put on a page for
 * an interaction most visits won't use, so this carries only the four series
 * the meteogram actually draws.
 */
export interface PlaceHour {
  at: string;
  time: string;
  tempC: number;
  feelsLike: number;
  precipChance: number;
  precipMm: number;
  windKph: number;
  gustKph: number;
  cloud: number;
  day: boolean;
}

interface PointResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    cloud_cover: number[];
    is_day: number[];
  };
}

/** The window the table compares over, and the claim it makes in words. */
const WINDOW = 12;

/*
 * The chart draws further than the table compares. Twelve hours is the right
 * span for "where should we go this afternoon"; the meteogram already runs
 * two days for home, and switching place should not silently shorten it.
 */
const CHART_HOURS = 48;

/** The forecast starts at midnight; the comparison should start now. */
function startIndexFor(times: string[]): number {
  const now = Date.now();
  const i = times.findIndex((t) => new Date(t).getTime() >= now - 3_600_000);
  return Math.max(0, i);
}

/** All six in one request, ranked driest first. */
export async function getPlaceForecasts(): Promise<PlaceForecast[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${PLACES.map((p) => p.latitude).join(",")}` +
    `&longitude=${PLACES.map((p) => p.longitude).join(",")}` +
    `&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,cloud_cover,is_day` +
    `&forecast_days=3&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = (await res.json()) as PointResponse[];
    if (!Array.isArray(data)) return [];

    return data
      .map((point, i) => {
        const hourly = point.hourly;
        const from = startIndexFor(hourly.time ?? []);
        const rain = (hourly.precipitation ?? []).slice(from, from + WINDOW);
        const chance = (hourly.precipitation_probability ?? []).slice(from, from + WINDOW);
        const gusts = (hourly.wind_gusts_10m ?? []).slice(from, from + WINDOW);
        const cloud = (hourly.cloud_cover ?? []).slice(from, from + WINDOW);

        const start = startIndexFor(hourly.time ?? []);
        const hours: PlaceHour[] = (hourly.time ?? [])
          .slice(start, start + CHART_HOURS)
          .map((at, h) => {
            const j = start + h;
            return {
              at,
              time: new Date(at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              tempC: Math.round(hourly.temperature_2m?.[j] ?? 0),
              feelsLike: Math.round(
                hourly.apparent_temperature?.[j] ?? hourly.temperature_2m?.[j] ?? 0
              ),
              precipChance: hourly.precipitation_probability?.[j] ?? 0,
              precipMm: hourly.precipitation?.[j] ?? 0,
              windKph: Math.round(hourly.wind_speed_10m?.[j] ?? 0),
              gustKph: Math.round(hourly.wind_gusts_10m?.[j] ?? 0),
              cloud: Math.round(hourly.cloud_cover?.[j] ?? 0),
              day: (hourly.is_day?.[j] ?? 1) === 1,
            };
          });

        return {
          name: PLACES[i].name,
          note: PLACES[i].note,
          rainMm: Number(rain.reduce((a, b) => a + b, 0).toFixed(1)),
          peakChance: chance.length ? Math.max(...chance) : 0,
          gustKph: gusts.length ? Math.round(Math.max(...gusts)) : 0,
          cloud: cloud.length
            ? Math.round(cloud.reduce((a, b) => a + b, 0) / cloud.length)
            : 0,
          hours,
        };
      })
      .sort((a, b) => a.rainMm - b.rainMm || a.gustKph - b.gustKph);
  } catch {
    return [];
  }
}
