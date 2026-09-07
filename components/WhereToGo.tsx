import { gustBand } from "@/lib/verdict";
import type { PlaceForecast } from "@/lib/places";

/**
 * Where to go, if the point is to stay dry.
 *
 * The Tyne valley, the coast and the hills half an hour apart can have
 * completely different afternoons, and a single-point forecast can't say so.
 * These are one API call — Open-Meteo takes a list of coordinates — ranked by
 * rain over the next twelve hours, then by gusts, because a dry hilltop in a
 * gale is not the answer either.
 */
export function WhereToGo({ places }: { places: PlaceForecast[] }) {
  if (places.length === 0) return null;

  const best = places[0];
  const worst = places[places.length - 1];
  const spread = worst.rainMm - best.rainMm;

  return (
    <section aria-labelledby="where-to-go">
      <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
        <h2 id="where-to-go" className="kicker text-[11px] text-accent">
          Where to go
        </h2>
        <p className="font-serif italic text-xs text-faint">
          Next twelve hours, within an hour&apos;s drive
        </p>
      </div>

      <p className="font-serif text-lg text-muted mt-6 max-w-2xl">
        {spread < 0.4 ? (
          <>
            Much the same everywhere — no reason to drive for better weather
            today.
          </>
        ) : (
          <>
            <span className="text-paper">{best.name}</span> is the driest of
            them, {formatRain(best.rainMm)} against{" "}
            {formatRain(worst.rainMm)} at {worst.name}.
          </>
        )}
      </p>

      <table className="mt-8 w-full text-[15px]">
        <caption className="sr-only">
          Rain and wind over the next twelve hours, driest first
        </caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="kicker text-[9px] text-faint text-left pb-3">
              Place
            </th>
            <th scope="col" className="kicker text-[9px] text-faint text-right pb-3">
              Rain
            </th>
            <th scope="col" className="kicker text-[9px] text-faint text-right pb-3 hidden sm:table-cell">
              Wettest hour
            </th>
            <th scope="col" className="kicker text-[9px] text-faint text-right pb-3">
              Gusts
            </th>
            <th scope="col" className="kicker text-[9px] text-faint text-right pb-3 hidden md:table-cell">
              Cloud
            </th>
          </tr>
        </thead>
        <tbody>
          {places.map((place) => (
            <tr key={place.name} className="border-b border-rule">
              <td className="py-3 pr-4">
                <span className="font-body font-semibold">{place.name}</span>
                <span className="kicker text-[9px] text-faint ml-3">
                  {place.note}
                </span>
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatRain(place.rainMm)}
              </td>
              <td className="py-3 text-right tabular-nums text-muted hidden sm:table-cell">
                {place.peakChance}%
              </td>
              <td className="py-3 text-right tabular-nums text-muted">
                {place.gustKph}
                <span className="text-faint"> km/h</span>
              </td>
              <td className="py-3 text-right tabular-nums text-muted hidden md:table-cell">
                {place.cloud}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="kicker text-[9px] text-faint mt-4">
        Windiest is {worst.name === best.name ? places[0].name : windiest(places)} —{" "}
        {gustBand(Math.max(...places.map((p) => p.gustKph))).note}
      </p>
    </section>
  );
}

function windiest(places: PlaceForecast[]) {
  return places.reduce((a, b) => (b.gustKph > a.gustKph ? b : a)).name;
}

/** Under a tenth of a millimetre is dry, and saying "0.0 mm" pretends other. */
function formatRain(mm: number) {
  return mm < 0.1 ? "Dry" : `${mm.toFixed(1)} mm`;
}
