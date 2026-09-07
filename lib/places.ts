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
}

interface PointResponse {
  hourly: {
    precipitation: number[];
    precipitation_probability: number[];
    wind_gusts_10m: number[];
    cloud_cover: number[];
  };
}

const WINDOW = 12;

/** All six in one request, ranked driest first. */
export async function getPlaceForecasts(): Promise<PlaceForecast[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${PLACES.map((p) => p.latitude).join(",")}` +
    `&longitude=${PLACES.map((p) => p.longitude).join(",")}` +
    `&hourly=precipitation,precipitation_probability,wind_gusts_10m,cloud_cover` +
    `&forecast_days=2&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = (await res.json()) as PointResponse[];
    if (!Array.isArray(data)) return [];

    return data
      .map((point, i) => {
        const hourly = point.hourly;
        const rain = (hourly.precipitation ?? []).slice(0, WINDOW);
        const chance = (hourly.precipitation_probability ?? []).slice(0, WINDOW);
        const gusts = (hourly.wind_gusts_10m ?? []).slice(0, WINDOW);
        const cloud = (hourly.cloud_cover ?? []).slice(0, WINDOW);

        return {
          name: PLACES[i].name,
          note: PLACES[i].note,
          rainMm: Number(rain.reduce((a, b) => a + b, 0).toFixed(1)),
          peakChance: chance.length ? Math.max(...chance) : 0,
          gustKph: gusts.length ? Math.round(Math.max(...gusts)) : 0,
          cloud: cloud.length
            ? Math.round(cloud.reduce((a, b) => a + b, 0) / cloud.length)
            : 0,
        };
      })
      .sort((a, b) => a.rainMm - b.rainMm || a.gustKph - b.gustKph);
  } catch {
    return [];
  }
}
