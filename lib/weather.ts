import type { WeatherData } from "./types";

const LOCATION = {
  name: process.env.WEATHER_LOCATION ?? "Newcastle upon Tyne",
  latitude: Number(process.env.WEATHER_LAT ?? 54.9783),
  longitude: Number(process.env.WEATHER_LON ?? -1.6178),
};

const WMO_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorms",
  96: "Thunderstorms",
  99: "Thunderstorms",
};

interface OpenMeteoResponse {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

export async function getWeather(): Promise<WeatherData | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}` +
    `&longitude=${LOCATION.longitude}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=5`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as OpenMeteoResponse;

    return {
      location: LOCATION.name,
      updatedAt: new Date().toISOString(),
      tempC: Math.round(data.current.temperature_2m),
      condition: WMO_CODES[data.current.weather_code] ?? "—",
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      forecast: data.daily.time.map((iso, i) => ({
        day: new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }),
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
        condition: WMO_CODES[data.daily.weather_code[i]] ?? "—",
      })),
    };
  } catch {
    return null;
  }
}

export interface HourPoint {
  /** ISO timestamp, so the chart can place it against the clock. */
  at: string;
  time: string;
  tempC: number;
  /** Apparent temperature — what the wind and humidity make of it. */
  feelsLike: number;
  precipChance: number;
  /** Millimetres in the hour. Probability says if; this says how much. */
  precipMm: number;
  windKph: number;
  gustKph: number;
  code: number;
  day: boolean;
  /** Percent of sky covered — the variable stargazing lives or dies on. */
  cloud: number;
  /** Metres. Below ~5000 the hills disappear; below 1000 it's fog. */
  visibility: number;
  uv: number;
}

export interface DetailedDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  code: number;
  precipChance: number;
  precipMm: number;
  windKph: number;
  gustKph: number;
  uvMax: number;
  cloudMean: number;
  /**
   * Mean cloud across that night's dark hours, which is the only cloud figure
   * that says anything about stargazing — a daily mean is mostly daytime.
   */
  nightCloud: number;
  /** Hours of the day with measurable rain, which reads better than a mean. */
  precipHours: number;
  sunrise: string;
  sunset: string;
}

export interface DetailedWeather {
  location: string;
  tempC: number;
  feelsLike: number;
  condition: string;
  code: number;
  /** Whether it is currently daylight here, which the page renders itself by. */
  isDay: boolean;
  humidity: number;
  windKph: number;
  gustKph: number;
  windDirection: string;
  /** Degrees the wind is coming from, for the compass. */
  windBearing: number;
  precipitation: number;
  pressure: number;
  /** Millibars over the last three hours: the oldest forecasting signal there is. */
  pressureTrend: number;
  uvNow: number;
  sunrise: string;
  sunset: string;
  sunriseAt: string;
  sunsetAt: string;
  hours: HourPoint[];
  days: DetailedDay[];
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function bearing(degrees: number) {
  return COMPASS[Math.round(degrees / 45) % 8];
}

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DetailedResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    weather_code: number[];
    surface_pressure: number[];
    uv_index: number[];
    is_day: number[];
    cloud_cover: number[];
    visibility: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    uv_index_max: number[];
    cloud_cover_mean: number[];
    precipitation_hours: number[];
    sunrise: string[];
    sunset: string[];
  };
}

/** How many hours of the meteogram to draw. A day and a half reads well. */
const HOURS_AHEAD = 48;

/** The fuller picture for the weather desk, rather than the masthead strip. */
export async function getDetailedWeather(): Promise<DetailedWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}` +
    `&longitude=${LOCATION.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,is_day` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code,surface_pressure,uv_index,is_day,cloud_cover,visibility` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,cloud_cover_mean,precipitation_hours,sunrise,sunset` +
    `&timezone=auto&forecast_days=16`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as DetailedResponse;

    // The forecast starting from the current hour.
    const now = Date.now();
    const startIndex = Math.max(
      0,
      data.hourly.time.findIndex((t) => new Date(t).getTime() >= now - 3_600_000)
    );

    const hours: HourPoint[] = data.hourly.time
      .slice(startIndex, startIndex + HOURS_AHEAD)
      .map((time, offset) => {
        const i = startIndex + offset;
        return {
          at: time,
          time: new Date(time).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tempC: Math.round(data.hourly.temperature_2m[i]),
          feelsLike: Math.round(data.hourly.apparent_temperature?.[i] ?? data.hourly.temperature_2m[i]),
          precipChance: data.hourly.precipitation_probability?.[i] ?? 0,
          precipMm: data.hourly.precipitation?.[i] ?? 0,
          windKph: Math.round(data.hourly.wind_speed_10m?.[i] ?? 0),
          gustKph: Math.round(data.hourly.wind_gusts_10m?.[i] ?? 0),
          code: data.hourly.weather_code?.[i] ?? 0,
          day: (data.hourly.is_day?.[i] ?? 1) === 1,
          cloud: Math.round(data.hourly.cloud_cover?.[i] ?? 0),
          visibility: Math.round(data.hourly.visibility?.[i] ?? 0),
          uv: Math.round(data.hourly.uv_index?.[i] ?? 0),
        };
      });

    /*
     * Pressure over the last three hours, which is how a falling glass is
     * traditionally read — and still the most useful single number about what
     * the next few hours will do.
     */
    /*
     * Cloud through each night, keyed by the date the evening belongs to, so
     * the outlook can say which nights are worth going outside for. Hours
     * after midnight are credited to the evening before, which is how anyone
     * planning a night actually thinks about it.
     */
    const nightCloud = new Map<string, number[]>();
    data.hourly.time.forEach((time, i) => {
      if ((data.hourly.is_day?.[i] ?? 1) === 1) return;
      const at = new Date(time);
      const evening = new Date(at);
      if (at.getHours() < 12) evening.setDate(evening.getDate() - 1);
      const key = evening.toISOString().slice(0, 10);
      const list = nightCloud.get(key) ?? [];
      list.push(data.hourly.cloud_cover?.[i] ?? 100);
      nightCloud.set(key, list);
    });

    const pressureNow = data.hourly.surface_pressure?.[startIndex];
    const pressureThen = data.hourly.surface_pressure?.[Math.max(0, startIndex - 3)];
    const pressureTrend =
      pressureNow !== undefined && pressureThen !== undefined
        ? Number((pressureNow - pressureThen).toFixed(1))
        : 0;

    return {
      location: LOCATION.name,
      tempC: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      condition: WMO_CODES[data.current.weather_code] ?? "—",
      code: data.current.weather_code,
      isDay: data.current.is_day === 1,
      humidity: Math.round(data.current.relative_humidity_2m),
      windKph: Math.round(data.current.wind_speed_10m),
      gustKph: Math.round(data.current.wind_gusts_10m ?? 0),
      windDirection: bearing(data.current.wind_direction_10m),
      windBearing: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      pressure: Math.round(data.current.surface_pressure ?? 0),
      pressureTrend,
      uvNow: Math.round(data.hourly.uv_index?.[startIndex] ?? 0),
      sunrise: clockTime(data.daily.sunrise[0]),
      sunset: clockTime(data.daily.sunset[0]),
      sunriseAt: data.daily.sunrise[0],
      sunsetAt: data.daily.sunset[0],
      hours,
      days: data.daily.time.map((date, i) => ({
        date,
        day: new Date(date).toLocaleDateString("en-GB", { weekday: "short" }),
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
        condition: WMO_CODES[data.daily.weather_code[i]] ?? "—",
        code: data.daily.weather_code[i],
        precipChance: data.daily.precipitation_probability_max?.[i] ?? 0,
        precipMm: Number((data.daily.precipitation_sum?.[i] ?? 0).toFixed(1)),
        windKph: Math.round(data.daily.wind_speed_10m_max?.[i] ?? 0),
        gustKph: Math.round(data.daily.wind_gusts_10m_max?.[i] ?? 0),
        uvMax: Math.round(data.daily.uv_index_max?.[i] ?? 0),
        cloudMean: Math.round(data.daily.cloud_cover_mean?.[i] ?? 0),
        nightCloud: (() => {
          const list = nightCloud.get(date);
          if (!list || list.length === 0) return -1;
          return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
        })(),
        precipHours: Math.round(data.daily.precipitation_hours?.[i] ?? 0),
        sunrise: clockTime(data.daily.sunrise[i]),
        sunset: clockTime(data.daily.sunset[i]),
      })),
    };
  } catch {
    return null;
  }
}
