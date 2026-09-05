export type CategorySlug =
  | "ai"
  | "hardware"
  | "cameras"
  | "lenses"
  | "technique"
  | "vehicles"
  | "sports"
  | "science"
  | "robotics"
  | "weather"
  | "screen"
  | "wire";

/** Nav groups: a handful of sections, each holding related desks. */
export interface Group {
  slug: string;
  label: string;
  dek: string;
  standfirst: string;
  desks: CategorySlug[];
}

export interface Category {
  slug: CategorySlug;
  /** The nav group this desk sits under, if any. */
  group?: string;
  /** Full name, used as the desk nameplate. */
  label: string;
  /** Abbreviated name for navigation. */
  short: string;
  dek: string;
  /** Standfirst on the desk's own page. */
  standfirst: string;
}

export interface Article {
  /** Stable, URL-safe slug used for /story/[id]. */
  id: string;
  category: CategorySlug;
  headline: string;
  dek: string;
  /** Longer plain-text summary, used when the feed carries no article body. */
  excerpt?: string;
  /** Sanitised article HTML, present when the publisher syndicates full text. */
  body?: string;
  /** Word count of `body`, for deciding how a story page is laid out. */
  words?: number;
  /** Author credit, where the article page provides one. */
  byline?: string;
  source: string;
  url: string;
  image: string;
  publishedAt: string;
}

export interface WeatherDay {
  day: string;
  high: number;
  low: number;
  condition: string;
}

export interface WeatherData {
  location: string;
  updatedAt: string;
  tempC: number;
  condition: string;
  high: number;
  low: number;
  forecast: WeatherDay[];
}
