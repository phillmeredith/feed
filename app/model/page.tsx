import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { SubNav } from "@/components/SubNav";
import { DeskTabs } from "@/components/DeskTabs";
import { DataTable } from "@/components/ui/DataTable";
import { Footer } from "@/components/Footer";
import {
  allModels,
  labs,
  blendedPrice,
  formatPrice,
  formatContext,
  formatModality,
  catalogueUpdated,
} from "@/lib/catalogue";
import { modelSlug } from "@/lib/openrouter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Every model, by what it costs — The Dispatch",
  description:
    "Token pricing, context window and modality for every generally available model, from OpenRouter's public catalogue.",
};

export default function ModelIndex() {
  const models = allModels();

  // Cheapest first on the blended figure, since that is the number that decides
  // what anything actually costs to run.
  const ranked = [...models]
    .filter((m) => (blendedPrice(m) ?? 0) > 0)
    .sort((a, b) => (blendedPrice(a) ?? 0) - (blendedPrice(b) ?? 0));

  const free = models.filter((m) => blendedPrice(m) === 0);
  const widest = [...models].sort((a, b) => b.contextTokens - a.contextTokens)[0];
  const updated = new Date(catalogueUpdated()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="pb-2">
          <p className="display text-subhead text-muted">
            <Link
              href="/technology"
              className="hover:text-accent transition-colors"
            >
              Technology
            </Link>
          </p>

          <SubNav group="technology" current="ai" />
          <h1 className="display text-title mt-4">
            Every model, by what it costs
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            The comparison no lab publishes about its rivals: token pricing,
            context and modality for {models.length} models across{" "}
            {labs().length} labs.
          </p>
          <p className="kicker text-micro text-faint mt-5">
            Updated {updated} · {free.length} free at point of use · widest
            context {formatContext(widest?.contextTokens ?? 0)}
          </p>

          <DeskTabs desk="ai" current="catalogue" />
        </div>

        <div className="mt-10" data-density="reference">
          <DataTable
            caption="Every model in the catalogue, cheapest blended price first"
            rows={ranked}
            rowKey={(m) => m.id}
            columns={[
              {
                key: "model",
                header: "Model",
                cell: (m) => (
                  <Link
                    href={`/model/${modelSlug(m.id)}`}
                    className="hover:text-accent transition-colors"
                  >
                    <span className="font-body font-semibold">{m.name}</span>
                  </Link>
                ),
              },
              {
                key: "lab",
                header: "Lab",
                cell: (m) => (
                  <span className="text-muted text-fine">{m.lab}</span>
                ),
              },
              {
                key: "in",
                header: "In",
                align: "right",
                numeric: true,
                cell: (m) => (
                  <span className="text-muted">{formatPrice(m.inputPrice)}</span>
                ),
              },
              {
                key: "out",
                header: "Out",
                align: "right",
                numeric: true,
                cell: (m) => (
                  <span className="text-muted">
                    {formatPrice(m.outputPrice)}
                  </span>
                ),
              },
              {
                key: "blended",
                header: "Blended",
                align: "right",
                numeric: true,
                cell: (m) => (
                  <span className="text-accent">
                    {formatPrice(blendedPrice(m))}
                  </span>
                ),
              },
              {
                key: "context",
                header: "Context",
                align: "right",
                numeric: true,
                hideBelow: "sm",
                cell: (m) => (
                  <span className="text-muted">
                    {formatContext(m.contextTokens)}
                  </span>
                ),
              },
              {
                key: "accepts",
                header: "Accepts",
                hideBelow: "md",
                cell: (m) => (
                  <span className="text-faint text-fine">
                    {formatModality(m)}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <p className="mt-8 text-fine text-faint max-w-2xl">
          Blended is three parts input to one part output — a read-heavy ratio.
          Ranking on input price alone flatters models that charge five times as
          much to answer, which is most of them. Prices are USD per million
          tokens, from OpenRouter&apos;s public catalogue.
        </p>
      </main>

      <Footer />
    </>
  );
}
