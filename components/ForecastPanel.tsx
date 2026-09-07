import type { DetailedWeather } from "@/lib/weather";
import { WeatherGlyph } from "./WeatherGlyph";
import { Meteogram, type Series } from "./Meteogram";
import { CONFIDENCE_LABEL, type DayConfidence } from "@/lib/ensemble";
import { HOUSEHOLD } from "@/lib/household";
import { DaylightArc } from "./DaylightArc";

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <p className="kicker text-micro text-faint">{label}</p>
      <p className="font-body text-small mt-1 figures">{value}</p>
      {note && <p className="kicker text-micro text-faint mt-0.5">{note}</p>}
    </div>
  );
}

/** A falling glass is the oldest forecast there is; say which way it's going. */
function pressureNote(trend: number) {
  if (trend >= 1.6) return "rising sharply";
  if (trend >= 0.5) return "rising";
  if (trend <= -1.6) return "falling sharply";
  if (trend <= -0.5) return "falling";
  return "steady";
}

/** UV is a number nobody knows the scale of, so it comes with its meaning. */
function uvNote(uv: number) {
  if (uv >= 11) return "extreme";
  if (uv >= 8) return "very high";
  if (uv >= 6) return "high";
  if (uv >= 3) return "moderate";
  return "low";
}

/**
 * Today in full, then the week. The masthead carries a one-line summary; this
 * is the version worth reading before deciding what to do with the day.
 */
export function ForecastPanel({
  weather,
  series,
  confidence = [],
}: {
  weather: DetailedWeather;
  series?: Series[];
  confidence?: DayConfidence[];
}) {
  const today = weather.days[0];
  const gusting = weather.gustKph > weather.windKph + 5;

  return (
    <section className="border-b border-rule pb-12">
      <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-8">
        <div className="flex items-center gap-6">
          <WeatherGlyph
            code={weather.code}
            day={weather.isDay}
            title={weather.condition}
            className="w-20 h-20 sm:w-24 sm:h-24 text-accent shrink-0"
          />
          <div className="flex items-baseline gap-5">
            <span className="display text-nameplate leading-none">
              {weather.tempC}°
            </span>
            <div>
              <p className="font-serif text-2xl text-accent">
                {weather.condition}
              </p>
              <p className="kicker text-micro text-faint mt-2">
                Feels like {weather.feelsLike}° · {weather.location}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-10 gap-y-5">
          <Stat
            label="Wind"
            value={`${weather.windKph} km/h ${weather.windDirection}`}
            note={gusting ? `gusting ${weather.gustKph}` : undefined}
          />
          <Stat
            label="Pressure"
            value={`${weather.pressure} mb`}
            note={pressureNote(weather.pressureTrend)}
          />
          <Stat label="Humidity" value={`${weather.humidity}%`} />
          <Stat
            label="UV"
            value={String(weather.uvNow)}
            note={uvNote(weather.uvNow)}
          />
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
        <div>
          <h2 className="panel-subtitle">
            The next two days
          </h2>
          <Meteogram hours={weather.hours} series={series} />
        </div>

        <DaylightArc
          sunrise={weather.sunriseAt}
          sunset={weather.sunsetAt}
          sunriseLabel={weather.sunrise}
          sunsetLabel={weather.sunset}
        />
      </div>

      <div className="mt-14">
        <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-2">
          <h2 className="kicker text-micro text-muted">
            The next {weather.days.length} days
          </h2>
          {confidence.length > 0 && (
            <p className="kicker text-micro text-faint">
              Confidence from {confidence.length} days of ensemble spread
            </p>
          )}
        </div>
        <ul className="mt-2 divide-y divide-[var(--rule)]">
          {weather.days.map((day, i) => {
            const range = weekRange(weather.days);
            return (
              <li
                key={day.date}
                className="flex items-center gap-4 sm:gap-6 py-3.5 text-small"
              >
                <span className="kicker text-micro text-faint w-10 shrink-0">
                  {i === 0 ? "Today" : day.day}
                </span>
                <WeatherGlyph
                  code={day.code}
                  title={day.condition}
                  className="w-7 h-7 text-muted shrink-0"
                />

                {/*
                 * A temperature bar per day, all on the same scale, so the
                 * week reads as a shape — where the cold snap is, where it
                 * warms up — instead of fourteen numbers to compare by eye.
                 */}
                <span className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
                  <span className="figures text-faint w-8 text-right">
                    {day.low}°
                  </span>
                  <span className="relative h-1 flex-1 bg-[var(--rule)]">
                    <span
                      className="absolute h-1 bg-accent"
                      style={{
                        left: `${((day.low - range.lo) / range.span) * 100}%`,
                        width: `${((day.high - day.low) / range.span) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="figures font-semibold w-8">
                    {day.high}°
                  </span>
                </span>

                <span className="sm:hidden font-body font-semibold figures w-16 shrink-0">
                  {day.high}° <span className="text-faint">{day.low}°</span>
                </span>

                <span className="kicker text-micro text-faint shrink-0 w-16 text-right figures">
                  {day.precipChance}% rain
                </span>
                <span className="kicker text-micro text-faint shrink-0 w-20 text-right figures hidden md:block">
                  {day.gustKph} km/h gust
                </span>

                {/*
                 * Which nights are worth going outside for. Marked with a word
                 * as well as a glyph, so it doesn't depend on spotting a
                 * symbol, and only where the model still knows anything.
                 */}
                <span className="kicker text-micro shrink-0 w-20 text-right hidden lg:block">
                  {day.nightCloud >= 0 && day.nightCloud <= HOUSEHOLD.stars.fair ? (
                    <span
                      className={
                        day.nightCloud <= HOUSEHOLD.stars.good
                          ? "text-accent"
                          : "text-muted"
                      }
                    >
                      {day.nightCloud <= HOUSEHOLD.stars.good
                        ? "Clear night"
                        : "Part clear"}
                    </span>
                  ) : (
                    <span className="sr-only">Cloudy night</span>
                  )}
                </span>

                {/*
                 * Sixteen days shown as sixteen equally confident numbers is a
                 * lie of omission. Where the ensemble members disagree, say so
                 * in words — never by fading the row, which would carry the
                 * meaning in colour alone.
                 */}
                <span className="kicker text-micro shrink-0 w-24 text-right hidden lg:block">
                  {confidenceFor(confidence, day.date) ? (
                    <span
                      className={
                        confidenceFor(confidence, day.date)!.level === "high"
                          ? "text-muted"
                          : "text-faint"
                      }
                    >
                      {CONFIDENCE_LABEL[confidenceFor(confidence, day.date)!.level]}
                    </span>
                  ) : (
                    <span className="text-faint">Beyond the model</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {today && (
          <p className="kicker text-micro text-faint mt-4">
            Sunrise {today.sunrise} · sunset {today.sunset} · UV peaks at{" "}
            {today.uvMax} today ({uvNote(today.uvMax)}) · forecast from
            Open-Meteo, refreshed every half hour
          </p>
        )}
      </div>
    </section>
  );
}

function confidenceFor(confidence: DayConfidence[], date: string) {
  return confidence.find((c) => c.date === date) ?? null;
}

/** One scale for the whole week, or the bars mean nothing across rows. */
function weekRange(days: DetailedWeather["days"]) {
  const lo = Math.min(...days.map((d) => d.low));
  const hi = Math.max(...days.map((d) => d.high));
  return { lo, hi, span: Math.max(1, hi - lo) };
}
