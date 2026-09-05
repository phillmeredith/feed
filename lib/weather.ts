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
  time: string;
  tempC: number;
  precipChance: number;
}

export interface DetailedDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  precipChance: number;
  uvMax: number;
}

export interface DetailedWeather {
  location: string;
  tempC: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windKph: number;
  windDirection: string;
  precipitation: number;
  sunrise: string;
  sunset: string;
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
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

/** The fuller picture for the weather desk, rather than the masthead strip. */
export async function getDetailedWeather(): Promise<DetailedWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}` +
    `&longitude=${LOCATION.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as DetailedResponse;

    // The next twelve hours, starting from the current hour.
    const now = Date.now();
    const startIndex = Math.max(
      0,
      data.hourly.time.findIndex((t) => new Date(t).getTime() >= now - 3_600_000)
    );

    return {
      location: LOCATION.name,
      tempC: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      condition: WMO_CODES[data.current.weather_code] ?? "—",
      humidity: Math.round(data.current.relative_humidity_2m),
      windKph: Math.round(data.current.wind_speed_10m),
      windDirection: bearing(data.current.wind_direction_10m),
      precipitation: data.current.precipitation,
      sunrise: clockTime(data.daily.sunrise[0]),
      sunset: clockTime(data.daily.sunset[0]),
      hours: data.hourly.time
        .slice(startIndex, startIndex + 12)
        .map((time, i) => ({
          time: new Date(time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          tempC: Math.round(data.hourly.temperature_2m[startIndex + i]),
          precipChance: data.hourly.precipitation_probability?.[startIndex + i] ?? 0,
        })),
      days: data.daily.time.map((date, i) => ({
        date,
        day: new Date(date).toLocaleDateString("en-GB", { weekday: "short" }),
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
        condition: WMO_CODES[data.daily.weather_code[i]] ?? "—",
        precipChance: data.daily.precipitation_probability_max?.[i] ?? 0,
        uvMax: Math.round(data.daily.uv_index_max?.[i] ?? 0),
      })),
    };
  } catch {
    return null;
  }
}
