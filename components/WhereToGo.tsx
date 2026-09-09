import { gustBand } from "@/lib/verdict";
import { DataTable } from "./ui/DataTable";
import type { PlaceForecast } from "@/lib/places";

/** The table's view of a place: everything except the hourly series. */
type PlaceSummary = Omit<PlaceForecast, "hours">;

/**
 * Where to go, if the point is to stay dry.
 *
 * The Tyne valley, the coast and the hills half an hour apart can have
 * completely different afternoons, and a single-point forecast can't say so.
 * These are one API call — Open-Meteo takes a list of coordinates — ranked by
 * rain over the next twelve hours, then by gusts, because a dry hilltop in a
 * gale is not the answer either.
 */
export function WhereToGo({ places }: { places: PlaceSummary[] }) {
  if (places.length === 0) return null;

  const best = places[0];
  const worst = places[places.length - 1];
  const spread = worst.rainMm - best.rainMm;

  return (
    <section aria-labelledby="where-to-go">
      <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
        <h2 id="where-to-go" className="kicker text-label text-accent">
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
            <span className="text-ink">{best.name}</span> is the driest of
            them, {formatRain(best.rainMm)} against{" "}
            {formatRain(worst.rainMm)} at {worst.name}.
          </>
        )}
      </p>

      <div className="mt-8" data-density="reference">
        <DataTable
          caption="Rain and wind over the next twelve hours, driest first"
          rows={places}
          rowKey={(place) => place.name}
          columns={[
            {
              key: "place",
              header: "Place",
              cell: (place) => (
                <>
                  <span className="font-body font-semibold">{place.name}</span>
                  <span className="kicker text-label text-faint ml-3">
                    {place.note}
                  </span>
                </>
              ),
            },
            {
              key: "rain",
              header: "Rain",
              align: "right",
              numeric: true,
              cell: (place) => formatRain(place.rainMm),
            },
            {
              key: "peak",
              header: "Wettest hour",
              align: "right",
              numeric: true,
              hideBelow: "sm",
              cell: (place) => `${place.peakChance}%`,
            },
            {
              key: "gust",
              header: "Gusts",
              align: "right",
              numeric: true,
              cell: (place) => (
                <>
                  {place.gustKph}
                  <span className="text-faint"> km/h</span>
                </>
              ),
            },
            {
              key: "cloud",
              header: "Cloud",
              align: "right",
              numeric: true,
              hideBelow: "md",
              cell: (place) => `${place.cloud}%`,
            },
          ]}
        />
      </div>

      <p className="kicker text-micro text-faint mt-4">
        Windiest is {worst.name === best.name ? places[0].name : windiest(places)} —{" "}
        {gustBand(Math.max(...places.map((p) => p.gustKph))).note}
      </p>
    </section>
  );
}

function windiest(places: PlaceSummary[]) {
  return places.reduce((a, b) => (b.gustKph > a.gustKph ? b : a)).name;
}

/** Under a tenth of a millimetre is dry, and saying "0.0 mm" pretends other. */
function formatRain(mm: number) {
  return mm < 0.1 ? "Dry" : `${mm.toFixed(1)} mm`;
}
