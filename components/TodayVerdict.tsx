import type { DetailedWeather } from "@/lib/weather";
import { readVerdict } from "@/lib/verdict";
import { HOUSEHOLD } from "@/lib/household";
import { CONFIDENCE_LABEL, type DayConfidence } from "@/lib/ensemble";

/**
 * The answers, first, in words.
 *
 * Everything below this on the page is instruments — a meteogram, a pressure
 * trend, a UV index. Instruments are what you consult once you know which
 * question you're asking. This is the part that says when to go out, whether
 * the wind is a problem, and whether tonight is worth looking up at, so the
 * rest of the page becomes the working rather than the answer.
 */
export function TodayVerdict({
  weather,
  confidence = [],
}: {
  weather: DetailedWeather;
  confidence?: DayConfidence[];
}) {
  const verdict = readVerdict(weather);
  const today = confidence[0];

  return (
    <section aria-labelledby="today-verdict">
      <h2
        id="today-verdict"
        className="kicker text-[11px] text-accent border-b border-rule pb-3"
      >
        In short
      </h2>

      <p className="font-serif text-[clamp(1.4rem,2.6vw,2rem)] leading-snug mt-6 max-w-3xl">
        {capitalise(verdict.headline)}.{" "}
        {verdict.outdoors ? (
          <>
            Best of the day is{" "}
            <strong className="text-accent font-normal">
              {verdict.outdoors.from}–{verdict.outdoors.to}
            </strong>
            .
          </>
        ) : (
          <>Nothing much to choose between the hours today.</>
        )}
      </p>

      <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Answer
          term="Get outside"
          value={
            verdict.outdoors
              ? `${verdict.outdoors.from}–${verdict.outdoors.to}`
              : "No clear window"
          }
          detail={verdict.outdoors?.detail ?? "Conditions much the same all day"}
        />
        <Answer
          term="Stay in"
          value={
            verdict.avoid ? `${verdict.avoid.from}–${verdict.avoid.to}` : "No need"
          }
          detail={verdict.avoid?.detail ?? "Nothing bad enough to plan around"}
        />
        <Answer
          term="Wind"
          value={verdict.wind.verdict.label}
          detail={`Gusting ${verdict.wind.peakGust} km/h${
            verdict.wind.peakAt ? ` around ${verdict.wind.peakAt}` : ""
          } — ${verdict.wind.verdict.note}`}
        />
        <Answer
          term="Stars tonight"
          value={
            verdict.stars.verdict === "good"
              ? "Worth it"
              : verdict.stars.verdict === "fair"
                ? "Maybe"
                : "Not tonight"
          }
          detail={
            verdict.stars.verdict === "good"
              ? verdict.stars.detail
              : `${verdict.stars.detail}. ${nextClearNight(weather)}`
          }
        />
      </dl>

      <p className="kicker text-[9px] text-faint mt-8">
        Take: {verdict.carry}
        {today && (
          <>
            <span className="mx-2 text-rule">/</span>
            {CONFIDENCE_LABEL[today.level]} — the model runs agree to within{" "}
            {today.spreadC}°
          </>
        )}
      </p>
    </section>
  );
}

function Answer({
  term,
  value,
  detail,
}: {
  term: string;
  value: string;
  detail: string;
}) {
  return (
    <div>
      <dt className="kicker text-[9px] text-faint">{term}</dt>
      <dd>
        <p className="display text-[clamp(1.5rem,2.4vw,2rem)] leading-none mt-3 tabular-nums">
          {value}
        </p>
        <p className="font-serif text-[15px] leading-relaxed text-muted mt-3">
          {detail}
        </p>
      </dd>
    </div>
  );
}

/**
 * When the sky next clears, so a poor night is an answer rather than a dead
 * end. Only looks as far as the model is worth trusting.
 */
function nextClearNight(weather: DetailedWeather): string {
  const clear = weather.days
    .slice(1, 8)
    .find((d) => d.nightCloud >= 0 && d.nightCloud <= HOUSEHOLD.stars.good);
  if (!clear) return "Nothing clear in the next week either";
  const when = new Date(clear.date).toLocaleDateString("en-GB", {
    weekday: "long",
  });
  return `${when} looks the next clear one, at ${clear.nightCloud}% cloud`;
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
