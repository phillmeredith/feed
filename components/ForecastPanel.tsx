import type { DetailedWeather } from "@/lib/weather";
import { WeatherGlyph } from "./WeatherGlyph";
import { Meteogram } from "./Meteogram";
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
      <p className="kicker text-[9px] text-faint">{label}</p>
      <p className="font-body text-[15px] mt-1 tabular-nums">{value}</p>
      {note && <p className="kicker text-[9px] text-faint mt-0.5">{note}</p>}
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
export function ForecastPanel({ weather }: { weather: DetailedWeather }) {
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
            <span className="display text-[clamp(3.5rem,9vw,6rem)] leading-none">
              {weather.tempC}°
            </span>
            <div>
              <p className="font-serif text-2xl text-accent">
                {weather.condition}
              </p>
              <p className="kicker text-[10px] text-faint mt-2">
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
          <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
            The next day and a half
          </h2>
          <Meteogram hours={weather.hours} />
        </div>

        <DaylightArc
          sunrise={weather.sunriseAt}
          sunset={weather.sunsetAt}
          sunriseLabel={weather.sunrise}
          sunsetLabel={weather.sunset}
        />
      </div>

      <div className="mt-14">
        <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
          The week ahead
        </h2>
        <ul className="mt-2 divide-y divide-[var(--rule)]">
          {weather.days.map((day, i) => {
            const range = weekRange(weather.days);
            return (
              <li
                key={day.date}
                className="flex items-center gap-4 sm:gap-6 py-3.5 text-[15px]"
              >
                <span className="kicker text-[10px] text-faint w-10 shrink-0">
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
                  <span className="tabular-nums text-faint w-8 text-right">
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
                  <span className="tabular-nums font-semibold w-8">
                    {day.high}°
                  </span>
                </span>

                <span className="sm:hidden font-body font-semibold tabular-nums w-16 shrink-0">
                  {day.high}° <span className="text-faint">{day.low}°</span>
                </span>

                <span className="kicker text-[9px] text-faint shrink-0 w-16 text-right tabular-nums">
                  {day.precipChance}% rain
                </span>
                <span className="kicker text-[9px] text-faint shrink-0 w-20 text-right tabular-nums hidden md:block">
                  {day.gustKph} km/h gust
                </span>
              </li>
            );
          })}
        </ul>
        {today && (
          <p className="kicker text-[9px] text-faint mt-4">
            Sunrise {today.sunrise} · sunset {today.sunset} · UV peaks at{" "}
            {today.uvMax} today ({uvNote(today.uvMax)}) · forecast from
            Open-Meteo, refreshed every half hour
          </p>
        )}
      </div>
    </section>
  );
}

/** One scale for the whole week, or the bars mean nothing across rows. */
function weekRange(days: DetailedWeather["days"]) {
  const lo = Math.min(...days.map((d) => d.low));
  const hi = Math.max(...days.map((d) => d.high));
  return { lo, hi, span: Math.max(1, hi - lo) };
}
