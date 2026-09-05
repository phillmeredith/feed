import type { DetailedWeather } from "@/lib/weather";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="kicker text-[9px] text-faint">{label}</p>
      <p className="font-body text-[15px] mt-1">{value}</p>
    </div>
  );
}

/**
 * Today in full, then the week. The masthead carries a one-line summary; this
 * is the version worth reading before deciding what to do with the day.
 */
export function ForecastPanel({ weather }: { weather: DetailedWeather }) {
  const today = weather.days[0];
  const peak = Math.max(...weather.hours.map((h) => h.tempC));
  const floor = Math.min(...weather.hours.map((h) => h.tempC));
  const span = Math.max(1, peak - floor);

  return (
    <section className="border-b border-rule pb-10">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="flex items-baseline gap-5">
          <span className="display text-[clamp(3.5rem,9vw,6rem)] leading-none">
            {weather.tempC}°
          </span>
          <div>
            <p className="font-serif text-2xl text-accent">{weather.condition}</p>
            <p className="kicker text-[10px] text-faint mt-2">
              Feels like {weather.feelsLike}° · {weather.location}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-8 gap-y-4">
          <Stat label="Wind" value={`${weather.windKph} km/h ${weather.windDirection}`} />
          <Stat label="Humidity" value={`${weather.humidity}%`} />
          <Stat label="Rain now" value={`${weather.precipitation} mm`} />
          <Stat label="Sunrise" value={weather.sunrise} />
          <Stat label="Sunset" value={weather.sunset} />
        </div>
      </div>

      {/* Next twelve hours, drawn as a simple temperature profile. */}
      {weather.hours.length > 0 && (
        <div className="mt-10">
          <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
            Next twelve hours
          </h2>
          <ul className="mt-4 flex justify-between gap-1 overflow-x-auto">
            {weather.hours.map((hour) => (
              <li key={hour.time} className="text-center min-w-[3.2rem]">
                <p className="kicker text-[9px] text-faint">{hour.time}</p>
                <div className="h-16 flex items-end justify-center mt-2">
                  <span
                    className="w-1 bg-accent"
                    style={{
                      height: `${20 + ((hour.tempC - floor) / span) * 44}px`,
                    }}
                  />
                </div>
                <p className="font-body font-semibold text-sm mt-2">{hour.tempC}°</p>
                <p className="kicker text-[9px] text-faint mt-1">
                  {hour.precipChance}%
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <h2 className="kicker text-[10px] text-muted border-b border-rule pb-2">
          The week ahead
          {today && ` · UV ${today.uvMax} today`}
        </h2>
        <ul className="mt-2 divide-y divide-[var(--rule)]">
          {weather.days.map((day) => (
            <li
              key={day.date}
              className="flex items-baseline gap-4 py-3 text-[15px]"
            >
              <span className="kicker text-[10px] text-faint w-12 shrink-0">
                {day.day}
              </span>
              <span className="font-body font-semibold w-16 shrink-0">
                {day.high}° <span className="text-faint">{day.low}°</span>
              </span>
              <span className="text-muted flex-1 min-w-0 truncate">
                {day.condition}
              </span>
              <span className="kicker text-[9px] text-faint shrink-0">
                {day.precipChance}% rain
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
