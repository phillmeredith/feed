import Link from "next/link";
import type { ModelRelease } from "@/lib/models";
import { matchByName } from "@/lib/catalogue";
import { modelSlug } from "@/lib/openrouter";

function date(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/**
 * Open-weight releases come from the Hub. Closed models (GPT, Claude, Gemini)
 * publish no machine-readable release record anywhere, so they are recovered
 * from this desk's own reporting and link to the story here.
 */
/**
 * A release name leads to the model's own page when the catalogue has it, and
 * falls back to the story that reported it. Clicking the name of a thing
 * should go to the thing.
 */
function ModelName({ model }: { model: ModelRelease }) {
  const entry = matchByName(model.name);
  const href = entry
    ? `/model/${modelSlug(entry.id)}`
    : model.storyId
      ? `/story/${model.storyId}`
      : null;

  if (!href) return <>{model.name}</>;
  return (
    <Link href={href} className="hover:text-accent transition-colors">
      {model.name}
    </Link>
  );
}

export function ModelTable({ models }: { models: ModelRelease[] }) {
  if (models.length === 0) return null;

  return (
    <section className="mt-20 border-t border-rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display text-2xl sm:text-3xl">Recent model releases</h2>
        <p className="font-serif italic text-sm text-muted">
          Newest first · open weights and closed
        </p>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse font-meta text-sm">
          <thead>
            <tr className="border-b border-rule">
              <th className="kicker text-[9px] text-muted text-left pb-3 pr-4">
                Model
              </th>
              <th className="kicker text-[9px] text-muted text-left pb-3 pr-4">
                Lab
              </th>
              <th className="kicker text-[9px] text-muted text-left pb-3 pr-4">
                Released
              </th>
              <th className="kicker text-[9px] text-muted text-left pb-3 pr-4">
                Weights
              </th>
              <th className="kicker text-[9px] text-muted text-right pb-3">
                Hub likes
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id} className="border-b border-rule last:border-0">
                <td className="py-3 pr-4 font-body font-semibold text-paper">
                  <ModelName model={model} />
                </td>
                <td className="py-3 pr-4 text-muted">{model.lab}</td>
                <td className="py-3 pr-4 text-muted whitespace-nowrap">
                  {date(model.releasedAt)}
                </td>
                <td className="py-3 pr-4 text-muted">
                  {model.weights === "open" ? "Open" : "Closed"}
                </td>
                <td className="py-3 text-right text-muted tabular-nums">
                  {model.weights === "open" ? compact(model.likes) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
