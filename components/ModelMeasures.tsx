import { quarterLabel, type ModelHistory } from "@/lib/modelmap";
import { BandHead } from "./Band";

/*
 * What the same 426 rows say once you stop reading them as a price list.
 *
 * Every figure below is derived from a field the catalogue actually carries —
 * a date, a lab, a price, a context window, a modality. There are no
 * benchmark scores in this data, so there are none here: a chart of made-up
 * numbers would look exactly like a chart of real ones, which is the whole
 * problem with drawing it.
 */

function Bars({
  rows,
  max,
  format,
  under,
}: {
  rows: { key: string; label: string; value: number; second?: number }[];
  max: number;
  format: (v: number) => string;
  /** The part of each bar that is a subset of it, drawn darker. */
  under?: string;
}) {
  return (
    <div className="mt-5">
      <ol className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[3.4rem_1fr_3.6rem] items-center gap-3">
            <span className="source">{row.label}</span>
            <span className="relative block h-[18px] bg-[rgba(43,39,33,0.06)]">
              <span
                className="absolute inset-y-0 left-0 bg-[var(--series-3)]"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
              {row.second !== undefined && (
                <span
                  className="absolute inset-y-0 left-0 bg-[var(--accent)]"
                  style={{ width: `${(row.second / max) * 100}%` }}
                />
              )}
            </span>
            <span className="source text-right figures">{format(row.value)}</span>
          </li>
        ))}
      </ol>
      {under && <p className="source mt-4 text-faint">{under}</p>}
    </div>
  );
}

export function ModelMeasures({ history }: { history: ModelHistory }) {
  const { cadence, labsActive, price, milestones, points } = history;

  const recent = <T extends { quarter: string }>(rows: T[]) => rows.slice(-9);

  const cadenceRows = recent(cadence);
  const cadenceMax = Math.max(...cadenceRows.map((c) => c.released), 1);
  const labRows = recent(labsActive);
  const labMax = Math.max(...labRows.map((l) => l.value), 1);
  const priceRows = recent(price);
  const priceMax = Math.max(...priceRows.map((p) => p.value), 0.01);

  const latest = cadence[cadence.length - 1];
  const earliest = cadence[0];
  const multimodalShare = latest
    ? Math.round((latest.multimodal / Math.max(latest.released, 1)) * 100)
    : 0;

  return (
    <div className="mt-14">
      <BandHead
        weight="major"
        title="What else the catalogue says"
        note="Every figure below is counted from the same rows as the map above."
      />

      <div className="ruled mt-8 grid grid-cols-1 items-start gap-y-12 md:grid-cols-2 2xl:grid-cols-4">
        <section>
          <h3 className="panel-title">Models released, by quarter</h3>
          <p className="standfirst mt-4 text-small">
            {earliest && latest && (
              <>
                {earliest.released} in {quarterLabel(earliest.quarter)},{" "}
                {latest.released} in {quarterLabel(latest.quarter)}. The oxide
                part of each bar took more than text.
              </>
            )}
          </p>
          <Bars
            rows={cadenceRows.map((c) => ({
              key: c.quarter,
              label: quarterLabel(c.quarter),
              value: c.released,
              second: c.multimodal,
            }))}
            max={cadenceMax}
            format={(v) => String(v)}
            under={`${multimodalShare}% of the newest quarter takes images, audio or video.`}
          />
        </section>

        <section>
          <h3 className="panel-title">Labs shipping, by quarter</h3>
          <p className="standfirst mt-4 text-small">
            The count above says the field moves faster. This says whether it
            moves faster because more people are in it.
          </p>
          <Bars
            rows={labRows.map((l) => ({
              key: l.quarter,
              label: quarterLabel(l.quarter),
              value: l.value,
            }))}
            max={labMax}
            format={(v) => String(v)}
          />
        </section>

        <section>
          <h3 className="panel-title">What a new model costs</h3>
          <p className="standfirst mt-4 text-small">
            The median blended price per million tokens of everything released
            that quarter, free models excluded. It has not fallen the way the
            context window has climbed.
          </p>
          <Bars
            rows={priceRows.map((p) => ({
              key: p.quarter,
              label: quarterLabel(p.quarter),
              value: p.value,
            }))}
            max={priceMax}
            format={(v) => `$${v.toFixed(2)}`}
          />
        </section>

        <section>
          <h3 className="panel-title">When the ceiling moved</h3>
          <p className="standfirst mt-4 text-small">
            The first model past each mark, and how long the one before it
            stood.
          </p>
          <ol className="mt-5">
            {milestones.map((m, i) => {
              const previous = milestones[i - 1];
              const months = previous
                ? Math.round(
                    (Date.parse(m.model.at) - Date.parse(previous.model.at)) /
                      2_629_800_000
                  )
                : null;
              return (
                <li key={m.tokens} className="border-b border-rule py-3 last:border-b-0">
                  <p className="headline text-[1.05rem] font-medium leading-[1.2]">
                    {m.model.name}
                  </p>
                  <p className="source mt-1">
                    {Math.round(m.tokens / 1000)}K · {m.as} ·{" "}
                    {new Date(m.model.at).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                    {months !== null && ` · ${months} months later`}
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="source mt-4 text-faint">
            Counted across {points.length} catalogued models.
          </p>
        </section>
      </div>

      {/*
        * Said plainly rather than left for a reader to notice: the one measure
        * everybody wants here is the one this data does not carry.
        */}
      <p className="standfirst mt-12 max-w-[46em] border-t border-rule-strong pt-5 text-small">
        No benchmark scores. The catalogue records what a model costs, how much
        it holds and what it accepts — not how well it does anything. Nothing on
        this page is a score, and none has been estimated to fill the gap.
      </p>
    </div>
  );
}
